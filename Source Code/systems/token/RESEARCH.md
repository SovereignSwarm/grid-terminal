# Token-2022 Transfer Fee Research

## 🎯 Objective
Implement 2% tax on all $GRID transfers:
- 1% → Burn (deflationary pressure)
- 1% → Operations wallet (development funding)

---

## ✅ RESEARCH COMPLETE (2026-02-08)

### Architecture Decision
**Selected:** Native Transfer Fee Extension  
**Rejected:** Custom Transfer Hook  
**Rationale:** See [ADR_TRANSFER_FEE.md](./ADR_TRANSFER_FEE.md)

---

## Options Evaluated

### ✅ Option A: Native Transfer Fee Extension (SELECTED)
**How It Works**:
- Token-2022 native extension
- Automatically withholds 2% on every transfer
- Works with all wallets (Phantom, Solflare) and DEXs (Jupiter, Raydium)
- Fees accumulate in recipient token accounts
- Periodically harvested via `withdraw-withheld-tokens`

**Advantages**:
- Audited by Solana Labs
- Zero custom code for fee collection
- Universal wallet/DEX compatibility
- Credibility for listings

**Limitation**:
- No automatic 50/50 split (requires sweep program)

---

### ❌ Option B: Custom Transfer Hook (REJECTED)
**Why Rejected**:
- Transfer hooks cannot sign for CPI transfers
- Would require users to call custom `taxed_transfer` instruction
- Standard wallet transfers would bypass tax
- DEX trades wouldn't pay tax
- Higher audit burden

---

### ❌ Option C: Client-Side Tax (REJECTED)
**Why Rejected**: Easily bypassed via CLI transfers

---

## Implementation Architecture

```
┌─────────────────────────────────────────────┐
│             $GRID Token Mint                │
│   Extension: TransferFeeConfig (200 bps)    │
└─────────────────────────────────────────────┘
                    │
                    ▼
            Every Transfer
                    │
    ┌───────────────┴───────────────┐
    │                               │
    ▼                               ▼
98% → Recipient              2% → Withheld
                                    │
                                    ▼
                          Fee Sweep Program
                                    │
                    ┌───────────────┴───────────────┐
                    │                               │
                    ▼                               ▼
            50% → Burn PDA               50% → Ops Treasury
```

---

## Fee Sweep Program

A simple Anchor program that:
1. Calls `withdraw_withheld_tokens` from token accounts
2. Transfers 50% to burn PDA (dead address)
3. Transfers 50% to operations wallet

**Permissionless**: Anyone can call (incentivized by small reward)

---

## Security Considerations

- **Immutable Fee Rate**: Set at mint creation, controlled by authority
- **No Owner Backdoors**: Transfer fee authority → DAO multisig
- **Audited Primitives**: Native extension = Solana Labs audited

---

## Next Steps

1. ✅ Create token with Transfer Fee extension
2. ✅ Deploy fee sweep program
3. ⏳ Test on devnet
4. ⏳ External audit
5. ⏳ Mainnet deployment

---

**Status**: 🟢 ARCHITECTURE FINALIZED  
**Decision Date**: 2026-02-08  
**Owner**: Antigravity
