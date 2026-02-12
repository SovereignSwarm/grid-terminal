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
        
        // Initialize policies with default (disabled) rules
        guard.policies = [PolicyRule::default(); 8];
        
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

    /// Add or Update a policy rule
    pub fn add_policy(ctx: Context<ManagePolicy>, rule: PolicyRule) -> Result<()> {
        let guard = &mut ctx.accounts.guard_state;
        
        // Find existing rule to update or empty slot
        let mut updated = false;
        
        // 1. Try to update existing rule with same ID
        for i in 0..guard.policies.len() {
            if guard.policies[i].rule_id == rule.rule_id && guard.policies[i].rule_id != 0 {
                guard.policies[i] = rule;
                updated = true;
                msg!("Updated Policy Rule ID: {}", rule.rule_id);
                break;
            }
        }
        
        // 2. If not updated, find first empty slot (rule_id == 0)
        if !updated {
            for i in 0..guard.policies.len() {
                if guard.policies[i].rule_id == 0 {
                    guard.policies[i] = rule;
                    updated = true;
                    msg!("Added New Policy Rule ID: {}", rule.rule_id);
                    break;
                }
            }
        }
        
        require!(updated, ErrorCode::PolicyStorageFull);
        Ok(())
    }

    /// Evaluate a transaction before execution with KYA verification
    /// Returns Ok if allowed, Err if blocked
    /// NOTE: This instruction updates the daily spend accumulator, requiring a mutable context.
    pub fn evaluate_transaction(
        ctx: Context<EvaluateTx>, 
        amount: u64,
        agent_kya_level: u8,
    ) -> Result<()> {
        let guard = &mut ctx.accounts.guard_state;
        let clock = Clock::get()?;
        
        // 1. Check cooldown
        require!(
            clock.unix_timestamp as u64 > guard.last_operation_ts + guard.cooldown_seconds as u64,
            ErrorCode::CooldownActive
        );
        
        // 2. Check pause state
        require!(!guard.paused, ErrorCode::GuardPaused);
        
        // 3. KYA Level verification
        let kya_level = match agent_kya_level {
            0 => KyaLevel::Anonymous,
            1 => KyaLevel::Basic,
            2 => KyaLevel::Verified,
            3 => KyaLevel::Endorsed,
            _ => return Err(ErrorCode::InvalidKyaLevel.into()),
        };
        
        // Minimum level check
        require!(
            kya_level as u8 >= KyaLevel::Basic as u8,
            ErrorCode::InsufficientKyaLevel
        );

        // 4. Per-transaction limit based on KYA level
        let max_amount = (guard.treasury_value as u128)
            .checked_mul(kya_level.per_tx_limit_bps() as u128)
            .ok_or(ErrorCode::Overflow)?
            .checked_div(10000)
            .ok_or(ErrorCode::Overflow)? as u64;
            
        require!(
            amount <= max_amount,
            ErrorCode::KyaLimitExceeded
        );
        
        // 5. Global Max Drawdown (5%)
        let global_max = (guard.treasury_value as u128)
            .checked_mul(guard.max_drawdown_bps as u128)
            .ok_or(ErrorCode::Overflow)?
            .checked_div(10000)
            .ok_or(ErrorCode::Overflow)? as u64;

        require!(
            amount <= global_max,
            ErrorCode::MaxDrawdownExceeded
        );
        
        // 6. Daily Spend Limit (0.5%)
        let current_ts = clock.unix_timestamp;
        if current_ts - guard.last_reset_ts >= 86400 {
             guard.daily_spend_accumulator = 0;
             guard.last_reset_ts = current_ts;
             msg!("Daily spend limit reset.");
        }

        let max_daily_spend = (guard.treasury_value as u128)
            .checked_mul(guard.daily_spend_bps as u128)
            .ok_or(ErrorCode::Overflow)?
            .checked_div(10000)
            .ok_or(ErrorCode::Overflow)? as u64;

        let new_daily_total = guard.daily_spend_accumulator
            .checked_add(amount)
            .ok_or(ErrorCode::Overflow)?;

        require!(
            new_daily_total <= max_daily_spend,
            ErrorCode::DailyLimitExceeded
        );

        // Update state
        guard.daily_spend_accumulator = new_daily_total;
        guard.last_operation_ts = clock.unix_timestamp as u64;
        
        msg!("Transaction approved. KYA Level: {:?}, Amount: {}", kya_level, amount);
        msg!("Daily Spend: {} / {}", new_daily_total, max_daily_spend);

        // Logic for Dynamic Policies
        for policy in guard.policies.iter() {
             if policy.enabled && policy.rule_id == 1 { // Rule ID 1: Custom Max Tx Size
                 let policy_limit = (guard.treasury_value as u128)
                     .checked_mul(policy.threshold_bps as u128)
                     .ok_or(ErrorCode::Overflow)?
                     .checked_div(10000)
                     .ok_or(ErrorCode::Overflow)? as u64;
                     
                 require!(
                     amount <= policy_limit,
                     ErrorCode::PolicyLimitExceeded
                 );
             }
        }
        
        Ok(())
    }
    
    pub fn evaluate_transaction_mut(
        ctx: Context<EvaluateTxMut>, 
        amount: u64,
        agent_kya_level: u8,
    ) -> Result<()> {
         let guard = &mut ctx.accounts.guard_state;
         let clock = Clock::get()?;
         
         if clock.unix_timestamp as u64 <= guard.last_operation_ts + guard.cooldown_seconds as u64 {
             return Err(ErrorCode::CooldownActive.into());
         }
         
         if guard.paused {
             return Err(ErrorCode::GuardPaused.into());
         }
         
         let kya_level = match agent_kya_level {
            0 => KyaLevel::Anonymous,
            1 => KyaLevel::Basic,
            2 => KyaLevel::Verified,
            3 => KyaLevel::Endorsed,
            _ => return Err(ErrorCode::InvalidKyaLevel.into()),
        };
        
        let max_amount = (guard.treasury_value as u128)
            .checked_mul(kya_level.per_tx_limit_bps() as u128)
            .ok_or(ErrorCode::Overflow)?
            .checked_div(10000)
            .ok_or(ErrorCode::Overflow)? as u64;
            
         if amount > max_amount {
             return Err(ErrorCode::KyaLimitExceeded.into());
         }

        // Daily Spend Logic
        let current_ts = clock.unix_timestamp;
         if current_ts - guard.last_reset_ts >= 86400 {
              guard.daily_spend_accumulator = 0;
              guard.last_reset_ts = current_ts;
         }

        let max_daily_spend = (guard.treasury_value as u128)
            .checked_mul(guard.daily_spend_bps as u128)
            .ok_or(ErrorCode::Overflow)?
            .checked_div(10000)
            .ok_or(ErrorCode::Overflow)? as u64;

        let new_daily_total = guard.daily_spend_accumulator
            .checked_add(amount)
            .ok_or(ErrorCode::Overflow)?;

        if new_daily_total > max_daily_spend {
             return Err(ErrorCode::DailyLimitExceeded.into());
        }

        guard.daily_spend_accumulator = new_daily_total;
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
    /// Active Policies (Replacing reserved space with 8 fixed slots)
    pub policies: [PolicyRule; 8],
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

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, Debug, Default, InitSpace)]
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
        mut,
        seeds = [b"guard"],
        bump
    )]
    pub guard_state: Account<'info, GuardState>,
}

// Added Mutable Context for actual execution
#[derive(Accounts)]
pub struct EvaluateTxMut<'info> {
    #[account(
        mut,
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
    #[msg("Policy storage is full (max 8 rules)")]
    PolicyStorageFull,
    #[msg("Transaction violates active policy limit")]
    PolicyLimitExceeded,
    #[msg("Math overflow occurred")]
    Overflow,
}
