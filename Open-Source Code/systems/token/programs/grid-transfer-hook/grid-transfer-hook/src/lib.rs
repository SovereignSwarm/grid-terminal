use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token_interface::{Mint, TokenAccount, TokenInterface},
};
use spl_transfer_hook_interface::instruction::ExecuteInstruction;
use spl_tlv_account_resolution::{
    account::ExtraAccountMeta,
    state::ExtraAccountMetaList,
    seeds::Seed,
};
use policy_guard::program::PolicyGuard;
use policy_guard::cpi::accounts::EvaluateTx as PolicyGuardEvaluate;
use policy_guard::cpi::evaluate_transaction as policy_guard_evaluate;
use agent_identity::program::AgentIdentity as AgentIdentityProgram;
use agent_identity::state::AgentIdentity;

declare_id!("7Py52EPwuCxYJ7UiBKrk5ce14T4NTxuutHFtyoWDdqFV");

// Network-specific Ops Wallet (matches grid-fee-sweep)
pub const OPS_WALLET: Pubkey = anchor_lang::solana_program::pubkey!("BqPoJnqNLeQZCV5d9YY3Fo2LwFw17fRZbTTkEWGJJRUU");

// Bootstrap Admin for initializing Config (Matches previous DAO_KEY)
pub const BOOTSTRAP_ADMIN: Pubkey = anchor_lang::solana_program::pubkey!("BqPoJnqNLeQZCV5d9YY3Fo2LwFw17fRZbTTkEWGJJRUU");

#[program]
pub mod grid_transfer_hook {
    use super::*;

    // ========================================================================
    // INSTRUCTION: Initialize Extra Account Meta List
    // ========================================================================
    pub fn initialize_extra_account_meta_list(
        ctx: Context<InitializeExtraAccountMetaList>,
    ) -> Result<()> {
        let mint = ctx.accounts.mint.key();
        
        // Security: Only Mint Authority can initialize metadata
        require!(
            ctx.accounts.mint.mint_authority.contains(&ctx.accounts.payer.key()),
            ErrorCode::Unauthorized
        );

        let account_metas = vec![
            // Account 6: Blacklist (Extra Account Meta Index 0)
            ExtraAccountMeta::new_with_seeds(
                &[Seed::Literal { bytes: b"firewall-blacklist".to_vec() }],
                false, // is_signer
                false, // is_writable
            )?,
            // Account 7: Policy Guard State (Extra Account Meta Index 1)
            ExtraAccountMeta::new_with_seeds(
                &[Seed::Literal { bytes: b"guard".to_vec() }],
                false, // is_signer
                false, // is_writable
            )?,
            // Account 8: Policy Guard Program (Extra Account Meta Index 2)
            ExtraAccountMeta::new_with_pubkey(
                &ctx.accounts.config.policy_guard_program,
                false, // is_signer
                false, // is_writable
            )?,
            // Account 9: Agent Identity PDA (Extra Account Meta Index 3)
            // Seeds: [b"agent-id", source_owner]
            // Note: index 3 in transfer_hook refers to source_owner
            ExtraAccountMeta::new_with_seeds(
                &[
                    Seed::Literal { bytes: b"agent-id".to_vec() },
                    Seed::AccountKey { index: 3 }, 
                ],
                false,
                false,
            )?,
            // Account 10: Agent Identity Program (Extra Account Meta Index 4)
            ExtraAccountMeta::new_with_pubkey(
                &ctx.accounts.config.agent_id_program,
                false,
                false,
            )?,
        ];

        let account_size = ExtraAccountMetaList::size_of(account_metas.len())? as u64;
        let lamports = Rent::get()?.minimum_balance(account_size as usize);

        let signer_seeds: &[&[&[u8]]] = &[&[
            b"extra-account-metas",
            mint.as_ref(),
            &[ctx.bumps.extra_account_meta_list],
        ]];

        anchor_lang::system_program::create_account(
            CpiContext::new(
                ctx.accounts.system_program.to_account_info(),
                anchor_lang::system_program::CreateAccount {
                    from: ctx.accounts.payer.to_account_info(),
                    to: ctx.accounts.extra_account_meta_list.to_account_info(),
                },
            )
            .with_signer(signer_seeds),
            lamports,
            account_size,
            ctx.program_id,
        )?;

        ExtraAccountMetaList::init::<ExecuteInstruction>(
            &mut ctx.accounts.extra_account_meta_list.try_borrow_mut_data()?,
            &account_metas,
        )?;

        msg!("ExtraAccountMetaList initialized for mint: {}", mint);
        Ok(())
    }

    // ========================================================================
    // INSTRUCTION: Initialize Config (Bootstrap)
    // ========================================================================
    pub fn initialize_config(
        ctx: Context<InitializeConfig>, 
        agent_id_program: Pubkey,
        policy_guard_program: Pubkey,
    ) -> Result<()> {
        let config = &mut ctx.accounts.config;
        config.admin = ctx.accounts.admin.key();
        config.agent_id_program = agent_id_program;
        config.policy_guard_program = policy_guard_program;
        config.bump = ctx.bumps.config;
        msg!("Transfer Hook Config Initialized. Admin: {}", config.admin);
        Ok(())
    }

    // ========================================================================
    // INSTRUCTION: Update Config
    // ========================================================================
    pub fn update_config(
        ctx: Context<UpdateAdmin>, 
        new_admin: Option<Pubkey>,
        new_agent_id_program: Option<Pubkey>,
        new_policy_guard_program: Option<Pubkey>,
    ) -> Result<()> {
        let config = &mut ctx.accounts.config;
        if let Some(admin) = new_admin {
            config.admin = admin;
        }
        if let Some(pid) = new_agent_id_program {
            config.agent_id_program = pid;
        }
        if let Some(pid) = new_policy_guard_program {
            config.policy_guard_program = pid;
        }
        Ok(())
    }

    // ========================================================================
    // INSTRUCTION: Transfer Hook (Firewall + Tax Logic)
    // ========================================================================
    pub fn transfer_hook(ctx: Context<TransferHook>, amount: u64) -> Result<()> {
        let source_owner = ctx.accounts.owner.key();
        let dest_owner = ctx.accounts.destination_token.owner;
        
        // 1. FIREWALL CHECKS
        // ------------------
        if let Some(blacklist) = &ctx.accounts.blacklist {
            if is_blacklisted(blacklist, &source_owner) {
                msg!("Grid Firewall: BLOCKED - Source {} is blacklisted", source_owner);
                return Err(ErrorCode::BlacklistedAddress.into());
            }
            if is_blacklisted(blacklist, &dest_owner) {
                msg!("Grid Firewall: BLOCKED - Destination {} is blacklisted", dest_owner);
                return Err(ErrorCode::BlacklistedAddress.into());
            }
        }

        // 2. POLICY GUARD CPI (AI Firewall)
        // ---------------------------------
        if let (Some(guard_state), Some(guard_program)) = (
            ctx.accounts.policy_guard_state.as_ref(),
            ctx.accounts.policy_guard_program.as_ref(),
        ) {
            let cpi_ctx = CpiContext::new(
                guard_program.to_account_info(), 
                PolicyGuardEvaluate {
                    guard_state: guard_state.to_account_info(),
                }
            );
            
            let mut kya_level: u8 = 1; // Default to Basic

            if let Some(agent_id_account) = &ctx.accounts.agent_identity {
                // Ensure Agent Identity PDA is for the source owner and is valid
                if agent_id_account.agent_wallet == source_owner { 
                    let clock = Clock::get()?;
                    if agent_id_account.subscription_expiry > clock.unix_timestamp {
                        kya_level = agent_id_account.kya_level;
                    } else {
                        kya_level = 1; 
                        msg!("Transfer Hook: Agent Subscription EXPIRED. Treated as Level 1.");
                    }
                }
            }

            policy_guard_evaluate(cpi_ctx, amount, kya_level)?;
            msg!("Policy Guard: APPROVED transfer of {} tokens (KYA {})", amount, kya_level);
        }
        
        // 3. ANTI-SNIPE PROTECTION
        // ------------------------
        // Threshold: 10% of Actual Total Supply
        let current_supply = ctx.accounts.mint.supply;
        let threshold = current_supply.checked_div(10).ok_or(ErrorCode::Overflow)?;
        
        if amount > threshold {
            msg!("Grid Firewall: ALERT - Large transfer {} (>10% supply). ANTI-SNIPE ACTIVE.", amount);
            return Err(ErrorCode::AntiSnipeTriggered.into());
        }
        
        msg!("Grid Protocol: Transfer of {} tokens processed.", amount);
        Ok(())
    }
    
    // ========================================================================
    // INSTRUCTION: Initialize Blacklist (DAO Only)
    // ========================================================================
    pub fn initialize_blacklist(ctx: Context<InitializeBlacklist>) -> Result<()> {
        let blacklist = &mut ctx.accounts.blacklist;
        blacklist.count = 0;
        blacklist.bump = ctx.bumps.blacklist;
        msg!("Firewall: Blacklist initialized");
        Ok(())
    }

    pub fn add_to_blacklist(ctx: Context<ManageBlacklist>, address: Pubkey) -> Result<()> {
        let blacklist = &mut ctx.accounts.blacklist;
        require!(blacklist.count < 100, ErrorCode::BlacklistFull);
        
        // Check for duplicates
        if is_blacklisted(blacklist, &address) {
            return Ok(());
        }

        blacklist.addresses[blacklist.count as usize] = address;
        blacklist.count += 1;
        msg!("Firewall: Added {} to blacklist", address);
        Ok(())
    }

    pub fn remove_from_blacklist(ctx: Context<ManageBlacklist>, address: Pubkey) -> Result<()> {
        let blacklist = &mut ctx.accounts.blacklist;
        let mut index = None;
        for i in 0..blacklist.count as usize {
            if blacklist.addresses[i] == address {
                index = Some(i);
                break;
            }
        }

        if let Some(idx) = index {
            blacklist.addresses[idx] = blacklist.addresses[blacklist.count as usize - 1];
            blacklist.addresses[blacklist.count as usize - 1] = Pubkey::default();
            blacklist.count -= 1;
            msg!("Firewall: Removed {} from blacklist", address);
        }
        Ok(())
    }
}

// ============================================================================
// ACCOUNT STRUCTS
// ============================================================================

#[derive(Accounts)]
pub struct InitializeExtraAccountMetaList<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,

    /// CHECK: ExtraAccountMetaList Account
    #[account(
        init,
        payer = payer,
        space = ExtraAccountMetaList::size_of(5)?,
        seeds = [b"extra-account-metas", mint.key().as_ref()],
        bump
    )]
    pub extra_account_meta_list: UncheckedAccount<'info>,

    #[account(
        seeds = [b"config"],
        bump = config.bump
    )]
    pub config: Account<'info, TransferHookConfig>,

    pub mint: InterfaceAccount<'info, Mint>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct TransferHook<'info> {
    pub source_token: InterfaceAccount<'info, TokenAccount>, // 0
    pub mint: InterfaceAccount<'info, Mint>, // 1
    pub destination_token: InterfaceAccount<'info, TokenAccount>, // 2
    /// CHECK: Source Owner
    pub owner: UncheckedAccount<'info>, // 3
    /// CHECK: ExtraAccountMetaList
    #[account(
        seeds = [b"extra-account-metas", mint.key().as_ref()],
        bump
    )]
    pub extra_account_meta_list: UncheckedAccount<'info>, // 4
    pub token_program: Interface<'info, TokenInterface>, // 5
    
    // Extra accounts from metadata list
    pub blacklist: Option<Account<'info, Blacklist>>, // Index 0 (Account 6)
    pub policy_guard_state: Option<UncheckedAccount<'info>>, // Index 1 (Account 7)
    pub policy_guard_program: Option<Program<'info, PolicyGuard>>, // Index 2 (Account 8)
    
    #[account(
        seeds = [b"agent-id", owner.key().as_ref()], 
        bump,
        seeds::program = agent_identity_program.key()
    )]
    pub agent_identity: Option<Account<'info, AgentIdentity>>, // Index 3 (Account 9)
    pub agent_identity_program: Option<Program<'info, AgentIdentityProgram>>, // Index 4 (Account 10)
}

#[derive(Accounts)]
pub struct InitializeConfig<'info> {
    #[account(mut, address = BOOTSTRAP_ADMIN)]
    pub admin: Signer<'info>,
    
    #[account(
        init,
        payer = admin,
        space = 8 + TransferHookConfig::INIT_SPACE,
        seeds = [b"config"],
        bump
    )]
    pub config: Account<'info, TransferHookConfig>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct UpdateAdmin<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,
    #[account(mut, seeds = [b"config"], bump = config.bump, has_one = admin)]
    pub config: Account<'info, TransferHookConfig>,
}

#[derive(Accounts)]
pub struct InitializeBlacklist<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,
    #[account(seeds = [b"config"], bump = config.bump, has_one = admin)]
    pub config: Account<'info, TransferHookConfig>,
    #[account(
        init,
        payer = admin,
        space = Blacklist::SPACE,
        seeds = [b"firewall-blacklist"],
        bump
    )]
    pub blacklist: Account<'info, Blacklist>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ManageBlacklist<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,
    #[account(seeds = [b"config"], bump = config.bump, has_one = admin)]
    pub config: Account<'info, TransferHookConfig>,
    #[account(mut, seeds = [b"firewall-blacklist"], bump = blacklist.bump)]
    pub blacklist: Account<'info, Blacklist>,
}

// ============================================================================
// STATE
// ============================================================================

#[account]
pub struct Blacklist {
    pub addresses: [Pubkey; 100],
    pub count: u8,
    pub bump: u8,
}

impl Blacklist {
    pub const SPACE: usize = 8 + (32 * 100) + 1 + 1;
}

#[account]
#[derive(InitSpace)]
pub struct TransferHookConfig {
    pub admin: Pubkey,
    pub agent_id_program: Pubkey,
    pub policy_guard_program: Pubkey,
    pub bump: u8,
}

// ============================================================================
// HELPERS & ERRORS
// ============================================================================

fn is_blacklisted(blacklist: &Blacklist, check: &Pubkey) -> bool {
    for i in 0..blacklist.count as usize {
        if &blacklist.addresses[i] == check { return true; }
    }
    false
}

#[error_code]
pub enum ErrorCode {
    #[msg("Address is blacklisted by the Grid Firewall")]
    BlacklistedAddress,
    #[msg("Blacklist is full (max 100 addresses)")]
    BlacklistFull,
    #[msg("Math overflow occurred")]
    Overflow,
    #[msg("Anti-Snipe Protection Triggered: Transfer too large")]
    AntiSnipeTriggered,
    #[msg("Unauthorized access")]
    Unauthorized,
}
