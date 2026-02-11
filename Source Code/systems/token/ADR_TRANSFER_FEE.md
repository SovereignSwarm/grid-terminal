# Architecture Decision Record: Token Transfer Fee

**Date:** 2026-02-08  
**Status:** APPROVED  
**Decided By:** Founder (via Antigravity session)

---

## Context

The $GRID token requires a 2% transfer tax (1% burn, 1% ops) as specified in Whitepaper v2.3.

### Options Evaluated

| Option | Description | Verdict |
|--------|-------------|---------|
| **A. Native Transfer Fee Extension** | Token-2022 built-in fee mechanism | ✅ SELECTED |
| **B. Custom Transfer Hook** | PDA Escrow with `taxed_transfer` instruction | ❌ Rejected |
| **C. Strict Hook Mode** | Block all non-compliant transfers | ❌ Rejected |

---

## Decision: Native Transfer Fee Extension

### Rationale
1. **Credibility:** Uses Solana Labs-audited code, not custom logic
2. **Compatibility:** Works with all wallets (Phantom, Solflare) and DEXs (Jupiter, Raydium)
3. **Security:** Smaller attack surface, no custom signing logic
4. **Whitepaper Alignment:** "Transfer Fee: 2.0%" implies automatic enforcement

### Why Custom Hook Was Rejected
- Requires users to call `taxed_transfer` explicitly
- Standard wallet transfers would bypass tax
- DEX trades would not pay tax
- Higher audit burden for custom code

---

## Implementation Plan

### Mint Configuration
```typescript
const transferFeeConfig = {
  transferFeeBasisPoints: 200, // 2%
  maximumFee: BigInt(1_000_000_000_000),
};
```

### Fee Distribution (Sweep Program)
Since native Transfer Fee sends 100% to a single withheld account, we need a **sweep program** to split 50/50:

1. Anyone can call `sweep_fees` (permissionless)
2. Program withdraws withheld fees from token accounts
3. 50% → Burn PDA (true burn via `burn` instruction)
4. 50% → Ops Treasury

### Authorities
- **TransferFeeAuthority:** DAO Multisig (Realms)
- **WithdrawWithheldAuthority:** DAO Multisig

---

## Impact on Existing Code

The PDA Escrow architecture in `grid-transfer-hook/src/lib.rs` is **deprecated** for base token transfers but may be repurposed for:
- Staking rewards distribution
- veGRID locking
- A2A payment rails (Phase 2)

---

## References
- Whitepaper v2.3, Section 5 (Line 74)
- Solana Token-2022 Transfer Fee Extension docs
- Antigravity session 2227dd78-979e-4285-a946-1ccf3567fff8
