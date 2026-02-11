# $GRID Genesis Tax: Exponential Decay Specification

> **Decision:** Replace linear decay with exponential decay to prevent MEV timing attacks

## Problem: Linear Decay is Predictable

Original (vulnerable):
```
Tax(block) = 50% - (block × 0.48%)

Block 1:   50.0%
Block 30:  35.6%  ← MEV bots target this range
Block 50:  26.0%
Block 100:  2.0%
```

MEV bots calculate exact break-even block and cluster buys.

---

## Solution: Exponential Decay

New (hardened):
```
Tax(block) = BaseTax + (GenesisTax - BaseTax) × e^(-λ × block)

Where:
- GenesisTax = 50%
- BaseTax = 2%
- λ = 0.05 (decay constant)
```

### Resulting Tax Schedule

| Block | Linear (Old) | Exponential (New) |
|-------|--------------|-------------------|
| 1     | 49.5%        | 49.7%            |
| 10    | 45.2%        | 31.2%            |
| 20    | 40.4%        | 19.9%            |
| 30    | 35.6%        | 13.5%            |
| 50    | 26.0%        |  7.4%            |
| 75    | 14.0%        |  3.8%            |
| 100   |  2.0%        |  2.2%            |
| 150   | N/A          |  2.0% (floor)    |

**Key Difference:** Exponential decay is steeper initially but asymptotes to base rate. No clear "safe" block for bots.

---

## Implementation

### Option A: Genesis Tax Program (Recommended)

A separate Solana program that:
1. Stores `genesis_block` at mint creation
2. Calculates tax dynamically per transfer
3. Integrates with fee sweep

```rust
pub fn calculate_genesis_tax(current_slot: u64, genesis_slot: u64) -> u64 {
    let blocks_elapsed = current_slot.saturating_sub(genesis_slot);
    
    const GENESIS_TAX_BPS: u64 = 5000;  // 50%
    const BASE_TAX_BPS: u64 = 200;       // 2%
    const DECAY_FACTOR: f64 = 0.05;
    
    if blocks_elapsed >= 150 {
        return BASE_TAX_BPS;
    }
    
    let decay = (-DECAY_FACTOR * blocks_elapsed as f64).exp();
    let tax = BASE_TAX_BPS as f64 + 
              (GENESIS_TAX_BPS - BASE_TAX_BPS) as f64 * decay;
    
    tax as u64
}
```

### Option B: Transfer Hook Hybrid

Use Transfer Hook to:
1. Check if within genesis window (150 blocks)
2. Apply additional tax on top of native 2%
3. Send excess to Protocol-Owned Liquidity

---

## Additional MEV Protections

### 1. Jito Bundle Protection
- Launch transactions via Jito MEV-protected RPC
- Prevents sandwich attacks during genesis

### 2. Randomized Tax Jitter (±5%)
```rust
// Add randomness using block hash
let jitter = block_hash[0] % 10;  // 0-9%
let tax = base_tax + jitter - 5;   // ±5% variance
```

### 3. Private Launch Phase
- First 10 blocks: only whitelisted addresses can buy
- Gives community 10 seconds before bots

---

## Whitepaper Update

Replace in Section 5 (Technical Architecture):

**Old:**
```
**Anti-Snipe**: 50% Genesis Tax decaying over 100 blocks.
```

**New:**
```
**Anti-Snipe**: 50% Genesis Tax with exponential decay (λ=0.05).
Reaches base 2% at ~150 blocks. MEV-protected launch via Jito bundles.
```

---

**Status:** 🟢 SPECIFICATION COMPLETE  
**Created:** 2026-02-08  
**Next:** Implement in genesis tax program
