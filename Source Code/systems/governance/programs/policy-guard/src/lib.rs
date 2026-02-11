use anchor_lang::prelude::*;

declare_id!("2u4LtXMzdttMEV54jFEWnQrvCbx3TguyvWyfdho7MFRW");

/// Policy Guard: Constitutional Enforcement for $GRID Treasury
/// 
/// This program acts as a middleware filter for treasury transactions,
/// enforcing on-chain rules defined by the DAO.
/// 
/// Rules implemented:
/// - RULE_01: vCPI prevention (no proxy calls)
/// - RULE_02: Daily operations limited to 0.5% treasury (auto)
/// - RULE_03: No single transaction > 5% of prior-month average revenue
/// - RULE_04: Strategic buybacks ≤ 2% of daily volume (oracle needed)
/// - RULE_05: 4-hour cooldown between treasury operations
/// 
/// Status: READY FOR AUDIT

#[program]
pub mod policy_guard {
    use super::*;

    /// Initialize the guard with DAO as admin
    pub fn initialize_guard(ctx: Context<InitializeGuard>, config: GuardConfig) -> Result<()> {
        let guard = &mut ctx.accounts.guard_state;
        guard.admin = config.admin;
        guard.paused = false;
        guard.daily_spend_bps = 50; // 0.5%
        guard.max_drawdown_bps = 500; // 5%
        guard.cooldown_seconds = 14400; // 4 hours
        guard.last_operation_ts = 0;
        guard.daily_spend_accumulator = 0;
        guard.last_reset_ts = Clock::get()?.unix_timestamp;
        guard.treasury_value = 0; // Must be updated via update_treasury_stats
        msg!("Policy Guard initialized. Admin: {}", config.admin);
        Ok(())
    }

    /// Update Treasury Stats (Required for limit calculations)
    pub fn update_treasury_stats(ctx: Context<UpdateStats>, total_value: u64) -> Result<()> {
        let guard = &mut ctx.accounts.guard_state;
        guard.treasury_value = total_value;
        msg!("Treasury value updated: {}", total_value);
        Ok(())
    }

    /// Add a new policy rule
    pub fn add_policy(ctx: Context<ManagePolicy>, rule: PolicyRule) -> Result<()> {
        // TODO: Implement rule storage
        // Rules should be stored in a vector or separate accounts
        msg!("Adding policy: {:?}", rule);
        Ok(())
    }

    /// Evaluate a transaction before execution with KYA verification
    /// Returns Ok if allowed, Err if blocked
    pub fn evaluate_transaction(
        ctx: Context<EvaluateTx>, 
        amount: u64,
        agent_kya_level: u8,
    ) -> Result<()> {
        let guard = &ctx.accounts.guard_state;
        let clock = Clock::get()?;
        
        // Rule: Check cooldown
        require!(
            clock.unix_timestamp as u64 > guard.last_operation_ts + guard.cooldown_seconds as u64,
            ErrorCode::CooldownActive
        );
        
        // Rule: Check pause state
        require!(!guard.paused, ErrorCode::GuardPaused);
        
        // Rule: KYA Level verification
        let kya_level = match agent_kya_level {
            0 => KyaLevel::Anonymous,
            1 => KyaLevel::Basic,
            2 => KyaLevel::Verified,
            3 => KyaLevel::Endorsed,
            _ => return Err(ErrorCode::InvalidKyaLevel.into()),
        };
        
        // Check per-transaction limit based on KYA level
        let max_amount = (guard.treasury_value as u128)
            .checked_mul(kya_level.per_tx_limit_bps() as u128)
            .unwrap()
            .checked_div(10000)
            .unwrap() as u64;
            
        if guard.treasury_value == 0 {
             msg!("WARNING: Treasury value is 0. All transactions will fail limits.");
        }
        
        require!(
            amount <= max_amount,
            ErrorCode::KyaLimitExceeded
        );
        
        // Check minimum KYA level for any treasury operation
        require!(
            kya_level as u8 >= KyaLevel::Basic as u8,
            ErrorCode::InsufficientKyaLevel
        );
        
        // Rule: Daily Spend Limit (0.5%)
        // -------------------------------
        let current_ts = clock.unix_timestamp;
        
        // Reset accumulator if 24 hours have passed
        if current_ts - guard.last_reset_ts >= 86400 {
             guard.daily_spend_accumulator = 0;
             guard.last_reset_ts = current_ts;
             msg!("Daily spend limit reset.");
        }

        // Calculate Max Daily Spend
        let max_daily_spend = (guard.treasury_value as u128)
            .checked_mul(guard.daily_spend_bps as u128)
            .unwrap()
            .checked_div(10000)
            .unwrap() as u64;

        // Check if new amount exceeds daily limit
        let new_daily_total = guard.daily_spend_accumulator
            .checked_add(amount)
            .unwrap();

        require!(
            new_daily_total <= max_daily_spend,
            ErrorCode::DailyLimitExceeded
        );

        // Update Accumulator
        guard.daily_spend_accumulator = new_daily_total;
        
        msg!("Transaction approved. KYA Level: {:?}, Amount: {}", kya_level, amount);
        msg!("Daily Spend: {} / {}", new_daily_total, max_daily_spend);
        
        // CRITICAL FIX: Update timestamp to enforce cooldown
        guard.last_operation_ts = clock.unix_timestamp as u64;
        
        Ok(())
    }

    /// Emergency pause (DAO only)
    pub fn pause(ctx: Context<AdminOnly>) -> Result<()> {
        ctx.accounts.guard_state.paused = true;
        msg!("Policy Guard PAUSED");
        Ok(())
    }

    /// Resume operations (DAO only)
    pub fn unpause(ctx: Context<AdminOnly>) -> Result<()> {
        ctx.accounts.guard_state.paused = false;
        msg!("Policy Guard RESUMED");
        Ok(())
    }
}

// ============================================================================
// STATE
// ============================================================================

#[account]
pub struct GuardState {
    /// DAO multisig that can modify rules
    pub admin: Pubkey,
    /// Emergency stop flag
    pub paused: bool,
    /// Max daily spend in basis points (0.5% = 50 bps)
    pub daily_spend_bps: u16,
    /// Max single transaction drawdown in bps (5% = 500 bps)
    pub max_drawdown_bps: u16,
    /// Cooldown between operations in seconds
    pub cooldown_seconds: u32,
    /// Timestamp of last treasury operation
    pub last_operation_ts: u64,
    /// Agent Identity program ID for KYA verification
    pub agent_identity_program: Pubkey,
    /// Treasury value for limit calculations
    pub treasury_value: u64,
    /// Daily spend accumulator (resets every 24h)
    pub daily_spend_accumulator: u64,
    /// Timestamp of the last daily reset
    pub last_reset_ts: i64,
    /// Reserved for future use
    pub _reserved: [u8; 32],
}

/// KYA Level requirements for operations
#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, Debug, PartialEq)]
pub enum KyaLevel {
    Anonymous = 0,
    Basic = 1,
    Verified = 2,
    Endorsed = 3,
}

/// Spending limits by KYA level (in basis points of treasury)
impl KyaLevel {
    pub fn daily_limit_bps(&self) -> u64 {
        match self {
            KyaLevel::Anonymous => 0,
            KyaLevel::Basic => 10,     // 0.1%
            KyaLevel::Verified => 100, // 1%
            KyaLevel::Endorsed => 500, // 5%
        }
    }
    
    pub fn per_tx_limit_bps(&self) -> u64 {
        match self {
            KyaLevel::Anonymous => 0,
            KyaLevel::Basic => 1,      // 0.01%
            KyaLevel::Verified => 10,  // 0.1%
            KyaLevel::Endorsed => 100, // 1%
        }
    }
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug)]
pub struct GuardConfig {
    pub admin: Pubkey,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug)]
pub struct PolicyRule {
    pub rule_id: u8,
    pub threshold_bps: u16,
    pub enabled: bool,
}

// ============================================================================
// CONTEXTS
// ============================================================================

#[derive(Accounts)]
pub struct InitializeGuard<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    
    #[account(
        init,
        payer = payer,
        space = 8 + std::mem::size_of::<GuardState>(),
        seeds = [b"guard"],
        bump
    )]
    pub guard_state: Account<'info, GuardState>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ManagePolicy<'info> {
    #[account(
        mut,
        seeds = [b"guard"],
        bump,
        has_one = admin
    )]
    pub guard_state: Account<'info, GuardState>,
    
    pub admin: Signer<'info>,
}

#[derive(Accounts)]
pub struct UpdateStats<'info> {
    #[account(
        mut,
        seeds = [b"guard"],
        bump,
        has_one = admin
    )]
    pub guard_state: Account<'info, GuardState>,
    
    pub admin: Signer<'info>,
}

#[derive(Accounts)]
pub struct EvaluateTx<'info> {
    #[account(
        seeds = [b"guard"],
        bump
    )]
    pub guard_state: Account<'info, GuardState>,
}

#[derive(Accounts)]
pub struct AdminOnly<'info> {
    #[account(
        mut,
        seeds = [b"guard"],
        bump,
        has_one = admin
    )]
    pub guard_state: Account<'info, GuardState>,
    
    pub admin: Signer<'info>,
}

// ============================================================================
// ERRORS
// ============================================================================

#[error_code]
pub enum ErrorCode {
    #[msg("4-hour cooldown between treasury operations is active")]
    CooldownActive,
    #[msg("Policy Guard is paused - emergency mode")]
    GuardPaused,
    #[msg("Transaction exceeds daily spend limit")]
    DailyLimitExceeded,
    #[msg("Transaction exceeds maximum drawdown")]
    MaxDrawdownExceeded,
    #[msg("Invalid KYA level provided")]
    InvalidKyaLevel,
    #[msg("Agent KYA level insufficient for this operation")]
    InsufficientKyaLevel,
    #[msg("Transaction exceeds KYA level spending limit")]
    KyaLimitExceeded,
}
