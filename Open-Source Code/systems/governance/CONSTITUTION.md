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

## Governance Structure

```
┌─────────────────────────────────────┐
│         SOVEREIGN REALM             │
│         (veGRID Holders)            │
│              ↓                      │
│         DAO GOVERNANCE              │
│         (Solana Realms)             │
│              ↓                      │
│         POLICY GUARD                │
│    (Constitutional Filter - VETO)   │
│              ↓                      │
│         SOVEREIGN SWARM             │
│         (Coordinators + Agents)     │
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

## Amendment Process

**The Constitution itself cannot be amended.** The 5 Laws are immutable by design.

Adjustable parameters may be modified via:
1. DAO proposal (72-hour minimum notice)
2. Tier-appropriate supermajority vote (51-75%)
3. Timelock execution
4. Policy Guard validation

---

*Founded by Humans | Bound by Immutable Law | February 2026*
