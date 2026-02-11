use anchor_lang::prelude::*;
use anchor_spl::token_interface::{TokenInterface, TokenAccount, Mint};
use anchor_spl::associated_token::AssociatedToken;

declare_id!("8TfDNebaSf2mDduUHvReTgcKjzu3BiJcQ2aA1ksqUn1a");

/// veGRID Staking Program
/// 
/// Implements vote-escrowed GRID (veGRID) for governance:
/// - Lock $GRID tokens for voting power
/// - Longer locks = more power (multiplier)
/// - Tier-based governance access

#[program]
pub mod vegrid_staking {
    use super::*;

    /// Create a new stake lock
    pub fn create_lock(
        ctx: Context<CreateLock>,
        amount: u64,
        lock_duration_days: u16,
    ) -> Result<()> {
        let lock = &mut ctx.accounts.lock;
        let clock = Clock::get()?;
        
        // Validate duration (min 30 days, max 730 days / 2 years)
        require!(lock_duration_days >= 30, ErrorCode::LockTooShort);
        require!(lock_duration_days <= 730, ErrorCode::LockTooLong);
        
        // Calculate veGRID power based on lock duration
        let multiplier = calculate_multiplier(lock_duration_days);
        let vegrid_power = (amount as u128)
            .checked_mul(multiplier as u128)
            .ok_or(ErrorCode::Overflow)?
            .checked_div(100)
            .ok_or(ErrorCode::Overflow)? as u64;
        
        // Transfer tokens to vault
        let transfer_ctx = CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            anchor_spl::token_interface::Transfer {
                from: ctx.accounts.user_token_account.to_account_info(),
                to: ctx.accounts.vault_token_account.to_account_info(),
                authority: ctx.accounts.owner.to_account_info(),
            },
        );
        anchor_spl::token_interface::transfer(transfer_ctx, amount)?;

        lock.owner = ctx.accounts.owner.key();
        lock.amount = amount;
        lock.vegrid_power = vegrid_power;
        lock.lock_start = clock.unix_timestamp;
        lock.lock_end = clock.unix_timestamp + (lock_duration_days as i64 * 86400);
        lock.tier = calculate_tier(vegrid_power);
        lock.bump = ctx.bumps.lock;
        
        msg!("Lock created: {} GRID -> {} veGRID (Tier {})", 
            amount, vegrid_power, lock.tier);
        Ok(())
    }

    /// Withdraw after lock expires
    pub fn withdraw(ctx: Context<Withdraw>) -> Result<()> {
        let lock = &ctx.accounts.lock;
        let clock = Clock::get()?;
        
        require!(clock.unix_timestamp >= lock.lock_end, ErrorCode::LockNotExpired);
        
        // Transfer tokens back to owner
        let seeds = &[
            b"vegrid-lock",
            ctx.accounts.owner.key.as_ref(),
            &[lock.bump],
        ];
        let signer = &[&seeds[..]];

        let transfer_ctx = CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            anchor_spl::token_interface::Transfer {
                from: ctx.accounts.lock_token_account.to_account_info(), // Vault
                to: ctx.accounts.owner_token_account.to_account_info(),  // User
                authority: ctx.accounts.lock.to_account_info(),
            },
            signer,
        );

        anchor_spl::token_interface::transfer(transfer_ctx, lock.amount)?;
        
        msg!("Withdrawn {} GRID", lock.amount);
        Ok(())
    }

    /// Get current voting power (decays as lock approaches expiry)
    pub fn get_voting_power(ctx: Context<GetVotingPower>) -> Result<u64> {
        let lock = &ctx.accounts.lock;
        let clock = Clock::get()?;
        
        if clock.unix_timestamp >= lock.lock_end {
            return Ok(0);
        }
        
        // Linear decay from vegrid_power to 0
        let remaining = lock.lock_end - clock.unix_timestamp;
        let total_duration = lock.lock_end - lock.lock_start;
        
        let current_power = (lock.vegrid_power as u128)
            .checked_mul(remaining as u128)
            .ok_or(ErrorCode::Overflow)?
            .checked_div(total_duration as u128)
            .ok_or(ErrorCode::Overflow)? as u64;
        
        msg!("Current voting power: {}", current_power);
        Ok(current_power)
    }
}

// ============================================================================
// HELPERS
// ============================================================================

/// Calculate multiplier based on lock duration
/// 30 days = 1.0x, 180 days = 1.25x, 365 days = 1.5x, 730 days = 2.0x
fn calculate_multiplier(days: u16) -> u16 {
    match days {
        0..=89 => 100,      // 1.0x
        90..=179 => 110,    // 1.1x
        180..=364 => 125,   // 1.25x
        365..=545 => 150,   // 1.5x
        546..=729 => 175,   // 1.75x
        _ => 200,           // 2.0x
    }
}

/// Calculate governance tier based on veGRID power
fn calculate_tier(vegrid_power: u64) -> u8 {
    const TIER_1_MIN: u64 = 100_000 * 1_000_000_000;      // 100K GRID
    const TIER_2_MIN: u64 = 1_000_000 * 1_000_000_000;    // 1M GRID
    const TIER_3_MIN: u64 = 10_000_000 * 1_000_000_000;   // 10M GRID
    const TIER_4_MIN: u64 = 50_000_000 * 1_000_000_000;   // 50M GRID
    
    if vegrid_power >= TIER_4_MIN { 4 }      // Sovereign
    else if vegrid_power >= TIER_3_MIN { 3 } // Senator
    else if vegrid_power >= TIER_2_MIN { 2 } // Citizen
    else if vegrid_power >= TIER_1_MIN { 1 } // Observer
    else { 0 }
}

// ============================================================================
// STATE
// ============================================================================

#[account]
pub struct StakeLock {
    pub owner: Pubkey,
    pub amount: u64,
    pub vegrid_power: u64,
    pub lock_start: i64,
    pub lock_end: i64,
    pub tier: u8,
    pub bump: u8,
}

impl StakeLock {
    pub const SPACE: usize = 8 + 32 + 8 + 8 + 8 + 8 + 1 + 1 + 32;
}

// ============================================================================
// CONTEXTS
// ============================================================================

#[derive(Accounts)]
pub struct CreateLock<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,
    
    #[account(
        init,
        payer = owner,
        space = StakeLock::SPACE,
        seeds = [b"vegrid-lock", owner.key().as_ref()],
        bump
    )]
    pub lock: Account<'info, StakeLock>,

    #[account(mut)]
    pub user_token_account: InterfaceAccount<'info, TokenAccount>,

    #[account(
        init_if_needed,
        payer = owner,
        associated_token::mint = mint,
        associated_token::authority = lock
    )]
    pub vault_token_account: InterfaceAccount<'info, TokenAccount>,

    pub mint: InterfaceAccount<'info, Mint>,
    pub token_program: Interface<'info, TokenInterface>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Withdraw<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,
    
    #[account(
        mut,
        close = owner,
        has_one = owner,
    )]
    pub lock: Account<'info, StakeLock>,

    #[account(mut)]
    pub lock_token_account: InterfaceAccount<'info, TokenAccount>, // Vault

    #[account(mut)]
    pub owner_token_account: InterfaceAccount<'info, TokenAccount>, // User

    pub token_program: Interface<'info, TokenInterface>,
}

#[derive(Accounts)]
pub struct GetVotingPower<'info> {
    pub lock: Account<'info, StakeLock>,
}

// ============================================================================
// ERRORS
// ============================================================================

#[error_code]
pub enum ErrorCode {
    #[msg("Minimum lock duration is 30 days")]
    LockTooShort,
    #[msg("Maximum lock duration is 730 days (2 years)")]
    LockTooLong,
    #[msg("Lock has not expired yet")]
    LockNotExpired,
    #[msg("Math overflow")]
    Overflow,
}
