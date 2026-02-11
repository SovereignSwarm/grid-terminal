# Tokenomics v3.1 - Fair Launch & Risk Collateral

> 🚀 **FAIR LAUNCH**: No presale, no private investors, no insider advantages.

---

## Token Specifications

| Parameter | Value |
|-----------|-------|
| **Name** | $GRID |
| **Standard** | Solana Token-2022 |
| **Decimals** | 9 |
| **Total Supply** | 1,073,741,824 (2³⁰) |
| **Transfer Fee** | 2.0% (1.0% Burn / 1.0% Ops) |
| **Devnet Mint** | `6VHZbCCPFiDx5FWXq41kmY3YMyJjJKM7Txt1D19uXuLo` |

---

## Allocation

| Allocation | Amount | % | Vesting |
|------------|--------|---|---------|
| **Liquidity Pool** | 590,558,003 | 55% | 🔒 Locked 12 months (Streamflow) |
| **Treasury (DAO)** | 214,748,365 | 20% | Governed by veGRID |
| **Ecosystem Fund** | 161,061,274 | 15% | Grants / Milestone-based |
| **Founder** | 80,530,636 | 7.5% | 0% TGE, 6mo cliff + 18mo linear |
| **Team & Advisors** | 26,843,546 | 2.5% | 6mo cliff + 18mo linear |

> ✅ **100% Accounted**: All tokens allocated. No hidden reserves.

---

## Fair Launch Principles

### No Presale
- Zero private investor rounds
- No discounted pre-TGE sales
- Equal entry point for all participants

### Anti-Snipe Protection
- **50% Genesis Tax** at launch
- Exponential decay (λ=0.05)
- Reaches base 2% at ~150 blocks
- MEV-protected via Jito bundles

### Governance Lockout
- Founder & Team cannot vote for 12 months
- Prevents governance capture
- Community-first decision making

---

## Vesting Enforcement

All vesting is enforced on-chain via **Streamflow.finance** smart contracts.

### Founder Schedule
```
Months 0-6:   ████████████████████ CLIFF (0% unlocked)
Months 6-24:  ░░░░░░░░░░░░░░░░░░░░ Linear unlock
Month 24:     ████████████████████ Fully vested
```

### Team Schedule
```
Months 0-6:   ████████████████████ CLIFF (0% unlocked)
Months 6-24:  ░░░░░░░░░░░░░░░░░░░░ Linear unlock
Month 24:     ████████████████████ Fully vested
```

---

## Transfer Fee Mechanism

| Fee Component | Rate | Destination |
|---------------|------|-------------|
| Burn | 1.0% | Sent to dead address (deflationary) |
| Operations | 1.0% | Treasury for ongoing operations |

### Agent Exemption
Whitelisted agent contracts pay **0% fee** to enable:
- Micro-payments between agents
- High-frequency treasury operations
- x402 payment protocol transactions

---

## Liquidity

- **55%** of supply in LP
- **100%** of LP tokens locked 12 months
- Lock contract: Streamflow
- Verification links published at TGE

---

## veGRID Governance

$GRID holders can lock tokens to receive **veGRID** (vote-escrowed GRID):

| Lock Duration | veGRID Multiplier | Tier |
|---------------|-------------------|------|
| 3 months | 0.25x | Voter |
| 6 months | 0.50x | Delegate |
| 12 months | 1.0x | Senator |
| 24 months | 2.0x | Sovereign |

**Benefits:**
- Proportional fee share from protocol revenue
- Voting power on governance proposals
- Higher tiers unlock betting pools and constitutional votes

See [veGRID Specification](VEGRID_SPEC.md) for details.

---

## V3.1: $GRID as Risk Collateral

In V3.1, $GRID is not just a governance and utility token — it is **Risk Capital**.

| Use Case | Mechanism | Amount |
|----------|-----------|--------|
| **KYA Tier Bonding** | Stake $GRID to upgrade Agent Passport tier | 1,000 - 100,000 $GRID |
| **Insurance First-Loss** | Locked in Liability Vaults; slashed on fault | Variable |
| **Arbitration Deposit** | Filing fee for disputes (refunded if successful) | 500 $GRID |
| **Transfer Hook Basis** | Passport status gates $GRID transfers | N/A (protocol-level) |

This creates a **demand flywheel**: agents need $GRID to operate → staking reduces supply → violations burn supply → deflationary pressure.

See [INSURANCE_SPEC.md](INSURANCE_SPEC.md) and [KYA_SPEC.md](KYA_SPEC.md) for details.

---

*Last Updated: February 2026 (V3.1)*
