# Burn Mechanism Optimization

> **Issue:** Current "burn" sends tokens to a dead PDA, not actual Token-2022 burn

## Current Implementation (Suboptimal)

```rust
// Tokens sent to burn PDA - NOT actually burned
transfer_checked(
    ...,
    TransferChecked {
        to: burn_token_account.to_account_info(),
        ...
    },
    ...
);
```

**Problems:**
- Total supply unchanged
- Token explorers show full supply
- Community may not perceive deflation

---

## Recommended: True Token-2022 Burn

Use `burn_checked` from spl-token-2022:

```rust
use anchor_spl::token_interface::{burn_checked, BurnChecked};

// In sweep_fees instruction:
if burn_amount > 0 {
    burn_checked(
        CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            BurnChecked {
                mint: ctx.accounts.mint.to_account_info(),
                from: ctx.accounts.fee_vault_token_account.to_account_info(),
                authority: ctx.accounts.fee_vault_authority.to_account_info(),
            },
            vault_seeds,
        ),
        burn_amount,
        decimals,
    )?;
}
```

**Benefits:**
- Total supply decreases on-chain
- Explorers show burned tokens
- True deflation visible

---

## Implementation Steps

1. Remove burn PDA account
2. Update sweep_fees to use burn_checked
3. Update Initialize (no burn_token_account needed)
4. Update SweepFees accounts
5. Test on devnet

---

## Account Changes

### Before
```rust
pub burn_token_account: InterfaceAccount<'info, TokenAccount>,
```

### After
```rust
// Remove burn_token_account from SweepFees
// Keep mint (mutable for burn)
#[account(mut)]
pub mint: InterfaceAccount<'info, Mint>,
```

---

**Status:** 🟡 REQUIRES CODE UPDATE  
**Created:** 2026-02-08
