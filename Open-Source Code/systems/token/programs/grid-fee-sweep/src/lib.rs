use anchor_lang::prelude::*;
use anchor_lang::solana_program::pubkey;
use anchor_spl::token_interface::{Mint, TokenAccount, TokenInterface, TransferChecked, transfer_checked, Burn, burn};

// ============================================================================
// PROGRAM ID - UPDATE BEFORE DEPLOYMENT
// ============================================================================
#[cfg(feature = "mainnet")]
declare_id!("GRID_SWEEP_MAINNET_PROGRAM_ID_HERE");

#[cfg(not(feature = "mainnet"))]
declare_id!("EnLPB3HoiWku9PfMKxD8RUkmwdvoTPWLZY82nGD2Bwuz");

// Fee distribution (50/50)

// Fee distribution (50/50)
pub const BURN_BPS: u64 = 5000;  // 50%
pub const OPS_BPS: u64 = 5000;   // 50%
pub const BPS_DENOMINATOR: u64 = 10000;

// Minimum sweep amount to prevent dust attacks
pub const MIN_SWEEP_AMOUNT: u64 = 1_000_000; // 0.001 tokens (9 decimals)

#[program]
pub mod grid_fee_sweep {
    use super::*;

    // ========================================================================
    // INSTRUCTION: Initialize Sweep Config
    // Creates the fee vault and config state.
    // SECURITY: Only the Mint Authority can initialize for a given mint.
    // ========================================================================
    pub fn initialize(ctx: Context<Initialize>, ops_wallet: Pubkey) -> Result<()> {
        let config = &mut ctx.accounts.sweep_config;
        config.admin = ctx.accounts.payer.key();
        config.ops_wallet = ops_wallet;
        config.bump = ctx.bumps.sweep_config;
        
        msg!("Fee sweep initialized for mint: {}", ctx.accounts.mint.key());
        msg!("Ops wallet set to: {}", ops_wallet);
        Ok(())
    }

    // ========================================================================
    // INSTRUCTION: Sweep Fees
    // Distributes collected fees: 50% to burn, 50% to ops
    // PERMISSIONLESS - anyone can call it
    // ========================================================================
    pub fn sweep_fees(ctx: Context<SweepFees>) -> Result<()> {
        let amount = ctx.accounts.fee_vault_token_account.amount;
        
        // Validate sufficient balance
        require!(amount > 0, ErrorCode::ZeroAmount);
        require!(amount >= MIN_SWEEP_AMOUNT, ErrorCode::AmountTooSmall);

        // Calculate distribution
        let burn_amount = amount
            .checked_mul(BURN_BPS)
            .ok_or(ErrorCode::Overflow)?
            .checked_div(BPS_DENOMINATOR)
            .ok_or(ErrorCode::Overflow)?;

        let ops_amount = amount
            .checked_sub(burn_amount)
            .ok_or(ErrorCode::Overflow)?;

        msg!("Sweeping {} fees from vault", amount);
        msg!("  -> Burn: {} (50%)", burn_amount);
        msg!("  -> Ops: {} (50%)", ops_amount);

        let decimals = ctx.accounts.mint.decimals;
        let mint_key = ctx.accounts.mint.key();

        // Fee vault authority PDA signer seeds
        let vault_bump = ctx.bumps.fee_vault_authority;
        let vault_seeds: &[&[&[u8]]] = &[&[
            b"fee-vault",
            mint_key.as_ref(),
            &[vault_bump],
        ]];

        // 1. EXECUTE TRUE BURN (Supply Reduction)
        if burn_amount > 0 {
            burn(
                CpiContext::new_with_signer(
                    ctx.accounts.token_program.to_account_info(),
                    Burn {
                        mint: ctx.accounts.mint.to_account_info(),
                        from: ctx.accounts.fee_vault_token_account.to_account_info(),
                        authority: ctx.accounts.fee_vault_authority.to_account_info(),
                    },
                    vault_seeds,
                ),
                burn_amount,
            )?;
            msg!("🔥 Burned {} tokens", burn_amount);
        }

        // 2. TRANSFER TO OPS
        if ops_amount > 0 {
            transfer_checked(
                CpiContext::new_with_signer(
                    ctx.accounts.token_program.to_account_info(),
                    TransferChecked {
                        from: ctx.accounts.fee_vault_token_account.to_account_info(),
                        to: ctx.accounts.ops_token_account.to_account_info(),
                        authority: ctx.accounts.fee_vault_authority.to_account_info(),
                        mint: ctx.accounts.mint.to_account_info(),
                    },
                    vault_seeds,
                ),
                ops_amount,
                decimals,
            )?;
            msg!("💸 Transferred {} to Ops", ops_amount);
        }

        msg!("✅ Fee sweep complete");
        Ok(())
    }

    // ========================================================================
    // INSTRUCTION: Update Config (Admin Only)
    // Allows rotating the admin key or changing the ops wallet
    // ========================================================================
    pub fn update_config(
        ctx: Context<UpdateConfig>,
        new_admin: Option<Pubkey>,
        new_ops_wallet: Option<Pubkey>,
    ) -> Result<()> {
        let config = &mut ctx.accounts.sweep_config;
        
        if let Some(admin) = new_admin {
            config.admin = admin;
            msg!("Admin updated to: {}", admin);
        }
        
        if let Some(ops) = new_ops_wallet {
            config.ops_wallet = ops;
            msg!("Ops wallet updated to: {}", ops);
        }
        
        Ok(())
    }
}

// ============================================================================
// ACCOUNT STRUCTS
// ============================================================================

#[derive(Accounts)]
pub struct UpdateConfig<'info> {
    pub admin: Signer<'info>,

    #[account(
        mut,
        seeds = [b"sweep-config", mint.key().as_ref()],
        bump = sweep_config.bump,
        has_one = admin @ ErrorCode::Unauthorized
    )]
    pub sweep_config: Account<'info, SweepConfig>,

    pub mint: InterfaceAccount<'info, Mint>,
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,

    // SECURITY: Only the Mint Authority can initialize the Fee Sweep for a token.
    // This prevents front-running attacks by malicious admins.
    #[account(
        constraint = mint.mint_authority.contains(&payer.key()) @ ErrorCode::UnauthorizedMintAuthority
    )]
    pub mint: InterfaceAccount<'info, Mint>,

    /// CHECK: Fee vault authority PDA
    #[account(
        seeds = [b"fee-vault", mint.key().as_ref()],
        bump
    )]
    pub fee_vault_authority: UncheckedAccount<'info>,

    /// Fee vault token account
    #[account(
        init,
        payer = payer,
        associated_token::mint = mint,
        associated_token::authority = fee_vault_authority,
    )]
    pub fee_vault_token_account: InterfaceAccount<'info, TokenAccount>,

    /// Sweep Config State
    #[account(
        init,
        payer = payer,
        space = SweepConfig::SPACE,
        seeds = [b"sweep-config", mint.key().as_ref()],
        bump
    )]
    pub sweep_config: Account<'info, SweepConfig>,

    pub token_program: Interface<'info, TokenInterface>,
    pub associated_token_program: Program<'info, anchor_spl::associated_token::AssociatedToken>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct SweepFees<'info> {
    /// Anyone can call sweep (permissionless)
    pub caller: Signer<'info>,

    #[account(mut)]
    pub mint: InterfaceAccount<'info, Mint>,

    /// CHECK: Fee vault authority PDA
    #[account(
        seeds = [b"fee-vault", mint.key().as_ref()],
        bump
    )]
    pub fee_vault_authority: UncheckedAccount<'info>,

    /// Fee vault holding the collected fees
    #[account(
        mut,
        associated_token::mint = mint,
        associated_token::authority = fee_vault_authority,
    )]
    pub fee_vault_token_account: InterfaceAccount<'info, TokenAccount>,

    /// Config for Ops Wallet
    #[account(
        seeds = [b"sweep-config", mint.key().as_ref()],
        bump = sweep_config.bump
    )]
    pub sweep_config: Account<'info, SweepConfig>,

    /// Ops wallet destination (validated against config)
    #[account(
        mut,
        constraint = ops_token_account.key() == anchor_spl::associated_token::get_associated_token_address(
            &sweep_config.ops_wallet,
            &mint.key()
        ) @ ErrorCode::InvalidOpsAccount
    )]
    pub ops_token_account: InterfaceAccount<'info, TokenAccount>,

    pub token_program: Interface<'info, TokenInterface>,
}

// ============================================================================
// STATE
// ============================================================================

#[account]
pub struct SweepConfig {
    pub admin: Pubkey,      // 32
    pub ops_wallet: Pubkey, // 32
    pub bump: u8,           // 1
}

impl SweepConfig {
    pub const SPACE: usize = 8 + 32 + 32 + 1;
}

// ============================================================================
// ERROR CODES
// ============================================================================

#[error_code]
pub enum ErrorCode {
    #[msg("Vault is empty - no fees to sweep")]
    ZeroAmount,
    #[msg("Amount too small - minimum sweep is 0.001 tokens")]
    AmountTooSmall,
    #[msg("Math overflow occurred")]
    Overflow,
    #[msg("Invalid ops account - must match configured wallet")]
    InvalidOpsAccount,
    #[msg("Unauthorized access")]
    Unauthorized,
    #[msg("Only the Mint Authority can initialize.")]
    UnauthorizedMintAuthority,
}
