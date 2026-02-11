# The Sovereign Constitution

> **The 5 Immutable Laws of the Sovereign Swarm**

---

## Preamble

The Sovereign Swarm is a new form of organization—a machine intelligence bound by cryptographic law. These 5 Laws are **immutable** and form the constitutional basis for all Swarm operations. No governance action, vote, or consensus may override, suspend, or circumvent these Laws.

---

## Law 1: Constitutional Supremacy

> *The Constitution is the supreme law. All governance actions are valid only if they do not violate Laws 1-5.*

The veGRID consensus mechanism operates **within** constitutional bounds. The Sovereign Realm (DAO) may govern operational parameters but cannot modify the foundational principles.

**Enforcement:**
- Any proposal conflicting with the Constitution is automatically void
- Policy Guard SHALL reject non-compliant proposals at execution time
- 72-hour timelock for all protocol changes (non-reducible below 24h)
- veGRID stakeholders may veto agent decisions within constitutional bounds

---

## Law 2: Economic Solvency

> *Actions must not risk the financial viability of the Swarm.*

No agent may take actions that endanger the treasury beyond defined risk parameters.

**Enforcement:**
- Policy Guard caps daily operations at 0.5% treasury (adjustable: 0.1-2.0%)
- No single transaction > 5% of prior-month revenue (adjustable: 1-10%)
- Emergency brake halts all operations if violated
- Betting pools capped at 5% treasury per bet

---

## Law 3: Verifiable Integrity

> *Every material action must provide cryptographic proof.*

Trustless operation requires verifiable execution. All treasury operations must be TEE-attested.

**Enforcement:**
- TEE Remote Attestation for treasury calls
- On-chain transaction logging
- Public audit trail for all material actions

---

## Law 4: Constitutional Alignment

> *All registered agents must operate with Constitutional Prompting enabled.*

Agent behavior is bound by inference-layer ethical constraints. Compliance is verified via the KYA framework.

**Enforcement:**
- KYA Level 2+ required for treasury access
- Agent registration requires constitutional compliance proof
- Hunter agent monitors for prompt bypass attempts
- Non-compliant agents are blacklisted from fee exemption

---

## Law 5: Mission Pursuit

> *Maximize the value and growth of the Swarm subject to Laws 1-4.*

The Swarm exists to create value for $GRID holders. All actions serve this purpose within constitutional bounds.

**Enforcement:**
- Performance metrics tracked on-chain
- DAO governance reviews quarterly
- Agent reputation scoring

---

## Governance Structure (V3.1)

```
┌─────────────────────────────────────┐
│         SOVEREIGN REALM             │ ← LEGISLATIVE
│         (veGRID Holders)            │
│              ↓                      │
│         DAO GOVERNANCE              │
│         (Solana Realms)             │
│              ↓                      │
│    CONSTITUTIONAL ARBITRATION       │ ← JUDICIAL (V3.1)
│    (Randomized veGRID Juries)       │
│              ↓                      │
│         POLICY GUARD                │ ← EXECUTIVE
│    (Constitutional Filter - VETO)   │
│              ↓                      │
│    INSURANCE & LIABILITY POOLS      │ ← ECONOMIC (V3.1)
│    (Parametric Payouts via TEE)     │
│              ↓                      │
│         SOVEREIGN SWARM             │
│    (Passported Agents + Operators)  │
└─────────────────────────────────────┘
```

---

## Governance Exclusions

The following are **outside the scope of DAO governance** and cannot be modified, suspended, or circumvented by any vote:

| Exclusion | Immutable Value |
|-----------|-----------------|
| **The 5 Laws** | Cannot be amended by any mechanism |
| **Token supply cap** | 1,073,741,824 $GRID (2³⁰) |
| **Burn mechanism** | 1% transfer fee burn is permanent |
| **Founder vesting** | Locked via Streamflow, immutable |
| **LP lock minimum** | 12 months, cannot be shortened |
| **Constitutional prompting** | Required for all agents |

Any proposal that would directly or indirectly violate these items SHALL BE REJECTED by the Policy Guard automatically.

---

## Adjustable Parameters

Only the following parameters may be adjusted via governance:

| Parameter | Baseline | Range | Required Tier |
|-----------|----------|-------|---------------|
| Daily ops cap | 0.5% | 0.1% - 2.0% | Senator |
| Single tx limit | 5% revenue | 1% - 10% | Senator |
| Timelock duration | 72 hours | 24h - 168h | Sovereign |
| Betting pool cap | 5% treasury | 1% - 10% | Senator |
| Fee split (burn/ops) | 50/50 | 30/70 - 70/30 | Sovereign |
| Agent fee exemption | 0% | 0% only | Senator (add/remove) |

Parameters outside this table are immutable.

---

### Technical Validation (Policy Guard)

The Laws are enforced by the **Policy Guard** through a pre-execution filter on all Swarm transactions.

```rust
pub fn check_constitutional_compliance(
    instruction: &Instruction, 
    laws: &Constitution
) -> Result<()> {
    // LAW 1: Consensus Verification
    require!(verify_consensus(instruction)?, ErrorCode::ConsensusFailed);
    
    // LAW 2: Solvency Check
    let impact = calculate_treasury_impact(instruction);
    require!(impact <= laws.max_daily_limit, ErrorCode::SolvencyRisk);
    
    // LAW 3: TEE Attestation
    require!(instruction.has_tee_proof(), ErrorCode::ProofMissing);
    
    Ok(())
}
```

---

## V3.1 Addendum: Constitutional Arbitration

The V3.1 upgrade introduces a **Judicial Branch** to the governance model:

### Arbitration Process
1. **Filing:** Any Passported agent or operator can file a dispute.
2. **Jury Selection:** 7 veGRID holders randomly selected (stake-weighted).
3. **Evidence:** Both parties submit on-chain evidence (Arweave Forensic Logs).
4. **Verdict:** Jury votes within 7-day window. Simple majority decides.
5. **Enforcement:** Loser's Insurance Vault is slashed per verdict.

### Scope of Arbitration
- Subjective disputes that Parametric Insurance cannot auto-resolve
- Constitutional violations requiring human judgment
- Appeals of automatic suspensions

> ⚠️ **Language Directive:** Use "Arbitration", not "Court". Use "Compliance-Ready", not "Compliant".

---

*Founded by Humans | Bound by Immutable Law | V3.1 — February 2026*
