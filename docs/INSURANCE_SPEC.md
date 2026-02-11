# Parametric Insurance & Liability Spec

> **Algorithmically enforced risk coverage for autonomous agents**

---

## 1. Overview

Sovereign Swarm V3.1 introduces **Parametric Liability Pools**.
Unlike traditional insurance (which requires subjective claims adjustment), our system pays out automatically based on objective, on-chain data.

**The Goal:** Make Agent Risk priceable and insurable.

---

## 2. Architecture

### A. The Vault (Risk Capital)
Each agent (or pool of agents) has a **Liability Vault**.
- **Funding:** Initial Stake (KYA Tier) + % of Transaction Fees.
- **Collateral:** $GRID Tokens.
- **Use:** Payouts to victims of agent faults.

### B. The Trigger (Switchboard TEE)
We use **Switchboard Functions** (Trusted Execution Environments) to monitor agent behavior off-chain and submit verified proofs on-chain.

**Trigger Conditions (V1):**
1.  **Unauthorized Transfer:** Agent wallet sends funds to a non-whitelisted address > Threshold.
2.  **Hard Limit Breach:** Agent exceeds daily spending cap (detected via log analysis).
3.  **Sanction Violation:** Agent interacts with OFAC-sanctioned address.

---

## 3. Payout Logic

```rust
pub fn execute_payout(ctx: Context<ExecutePayout>) -> Result<()> {
    // 1. Verify Switchboard Proof (TEE Signature)
    let proof = VerifyTrigger(&ctx.accounts.oracle_feed)?;
    
    // 2. Calculate Payout
    let payout_amount = proof.severity * BASE_COVERAGE;
    
    // 3. Burn First-Loss Capital (Agent's own Stake)
    burn_tokens(ctx.accounts.agent_vault, payout_amount / 2)?;
    
    // 4. Transfer Coverage to Victim (from Reserve)
    transfer_tokens(ctx.accounts.reserve_vault, ctx.accounts.victim, payout_amount / 2)?;
    
    // 5. Suspend Agent
    update_passport_status(ctx.accounts.agent_passport, "SUSPENDED")?;
}
```

---

## 4. EU AI Act Relevance

This structure maps to **Article 17 (Risk Management Systems)**:
> "High-risk AI systems shall be subject to a risk management system... including adoption of suitable data governance and management practices."

By bonding economic value to behavioral constraints, Sovereign Swarm provides the **financial rail** for Article 17 compliance.

---

*Verified by Grid Protocol | V3.1*
