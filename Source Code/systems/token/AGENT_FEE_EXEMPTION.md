# Agent Fee Exemption: Micro-Payment Solution

> **Decision:** Implement 2-tier system - 0% tax for whitelisted agent contracts, 2% for retail

## Problem: 2% Tax Kills Micro-Payments

The "Machine-Native Liquidity" vision requires agents to transact frequently:
- AI agent task payments: $0.01 - $1.00
- 2% tax on 100 daily micro-tasks = $0.73/year overhead
- High-frequency agents: economically unusable

---

## Solution: Agent Fee Exemption Whitelist

### Tier 1: Whitelisted Agents (0% Tax)

Verified agent contracts can transfer $GRID **without** the 2% tax:

| Whitelist Criteria | Description |
|-------------------|-------------|
| Verified Agent NFT | Council-issued NFT proving agent status |
| Registered Contract | Program ID on approved list |
| Rate Limited | Max 1000 tx/day per agent |

### Tier 2: Retail/Speculation (2% Tax)

All non-agent transfers pay standard 2% tax:
- DEX swaps
- Wallet-to-wallet transfers
- Centralized exchange deposits/withdrawals

---

## Implementation Options

### Option A: Transfer Hook Whitelist (Recommended)

Keep Native Transfer Fee (2%) but add Transfer Hook that **refunds** whitelisted agents:

```rust
pub fn transfer_hook(ctx: Context<TransferHook>, amount: u64) -> Result<()> {
    // Check if source is whitelisted agent
    if is_whitelisted_agent(&ctx.accounts.source_owner.key()) {
        // Calculate expected fee
        let fee = amount * 200 / 10000;  // 2%
        
        // Refund fee from treasury
        refund_fee(ctx, fee)?;
        
        msg!("Agent transfer: fee refunded");
    }
    
    Ok(())
}
```

**Pros:**
- Native fee still works for retail
- Agents get 0% effective tax
- Compatible with all wallets

**Cons:**
- Requires treasury to fund refunds
- Slight gas overhead

### Option B: Credit Layer (L2)

Build internal credit system for agent micro-payments:

```
┌─────────────────────────────────┐
│         Credit Layer            │
│  (Off-chain agent balances)     │
└─────────────────────────────────┘
        │           │
        ▼           ▼
   Agent A      Agent B
   (credits)    (credits)
        │           │
        └─────┬─────┘
              │ Periodic Settlement
              ▼
┌─────────────────────────────────┐
│       On-Chain $GRID            │
│    (2% tax on settlement)       │
└─────────────────────────────────┘
```

**Pros:**
- Zero on-chain fees for agents
- Instant settlement

**Cons:**
- Requires trust in credit layer
- More complex infrastructure

### Option C: Maximum Fee Cap

Use Token-2022's `maximum-fee` parameter:

```bash
spl-token create-token \
  --enable-transfer-fee \
  --transfer-fee-basis-points 200 \
  --maximum-fee 1000000000  # 1 $GRID max fee
```

**Effect:** Transfers over 50 $GRID pay max 1 $GRID fee (effectively <2%).

**Pros:**
- Built-in, no custom code
- Benefits both agents and whales

**Cons:**
- Reduces tax revenue from large transfers
- Doesn't fully solve micro-payment issue

---

## Recommended Implementation

**Phase 1 (Launch):** Use Maximum Fee Cap
- Set max fee to 0.1 $GRID
- Micro-payments: capped fee reduces overhead
- Large transfers: still pay meaningful tax

**Phase 2 (Post-Launch):** Add Agent Whitelist
- Deploy Transfer Hook with refund logic
- Issue Agent NFTs to verified bots
- Fund refund pool from treasury

---

## Whitelist Governance

Agent whitelist managed by DAO:
1. Agent applies with proof of legitimacy
2. Council reviews (security check)
3. DAO votes on addition
4. Agent receives NFT + whitelist entry

**Revocation:** Council can revoke for abuse (1-of-3 vote).

---

**Status:** 🟡 DESIGN PHASE  
**Created:** 2026-02-08  
**Next:** Implement max fee cap for Phase 1
