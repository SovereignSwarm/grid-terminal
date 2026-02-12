# $GRID Liquidity Pool Lock Strategy

> **Decision:** Lock 100% of LP tokens for 12+ months via Streamflow.finance

## Overview

To address the centralization risk (45% LP allocation), all LP tokens will be permanently locked using a verifiable on-chain service.

---

## Provider: Streamflow.finance

**Why Streamflow:**
- Solana-native (no bridge risk)
- $1B+ Total Value Locked
- Audited and battle-tested
- Public verification dashboard
- Supports Raydium LP tokens

---

## Lock Parameters

| Parameter | Value |
|-----------|-------|
| **Asset** | Raydium GRID/SOL LP Tokens |
| **Lock Duration** | 12 months minimum |
| **Lock Type** | Time-based (absolute unlock date) |
| **Beneficiary** | DAO Treasury multisig |
| **Visibility** | Public (linked from whitepaper) |

---

## Implementation Steps

### 1. Create Raydium Pool
```bash
# After token launch
npm run create-pool --pair GRID/SOL --initial-lp 0.5
```

### 2. Receive LP Tokens
- Raydium returns LP tokens to deployer wallet
- Verify LP token address and amount

### 3. Lock via Streamflow
```
1. Go to: app.streamflow.finance/vesting/create
2. Connect deployer wallet
3. Select: Token Lock (not Vesting)
4. Token: <LP_TOKEN_ADDRESS>
5. Amount: 100% of LP tokens
6. Cliff: 0 (immediate lock start)
7. Unlock Date: TGE + 12 months
8. Submit transaction
```

### 4. Public Verification
- Lock creates a public contract address
- Add verification link to:
  - Whitepaper
  - Website
  - Social announcements

---

## Verification

Anyone can verify the lock:
```
1. Go to: app.streamflow.finance/explorer
2. Search: <LOCK_CONTRACT_ADDRESS>
3. View: Lock status, duration, amount
```

---

## Alternative: Burn LP Tokens (Permanent Lock)

For maximum credibility, LP tokens can be **burned** instead of locked:

```bash
# Burn LP tokens (irreversible)
spl-token burn <LP_TOKEN_MINT> <AMOUNT> --owner <DEPLOYER>
```

**Trade-offs:**
- ✅ Ultimate trust signal
- ❌ Cannot recover liquidity EVER
- ❌ No governance over LP in future

**Recommendation:** Start with 12-month lock, evaluate burn at month 11.

---

## Whitepaper Update

Add to Section 7 (Tokenomics):
```markdown
## Liquidity Commitment
**100% of initial LP tokens are locked for 12 months** via Streamflow.finance.

Verification: [View Lock Contract](https://app.streamflow.finance/contract/<ADDRESS>)
```

---

**Status:** 🟢 STRATEGY DEFINED  
**Created:** 2026-02-08  
**Next:** Execute lock after pool creation
