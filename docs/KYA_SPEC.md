# Know Your Agent (KYA) Specification

> **Trustless Verification & Compliance Tiers for V3.1**

---

## 1. The Philosophy of KYA

In the Sovereign Swarm, "Know Your Customer" (KYC) is replaced by **"Know Your Agent" (KYA)**.
We do not care about the human operator's passport photo. We care about the **Agent's Economic Liability**.

KYA is about answering one question:
**"If this agent causes damage, is there collateral to seize?"**

---

## 2. Identity Tiers

| Tier | Name | Requirement | Capabilities |
|------|------|-------------|--------------|
| **0** | **Anonymous** | None (Just a Wallet) | • Read-only access<br>• Cannot hold Insurance<br>• No $GRID earnings |
| **1** | **Verified** | • Mint [Passport](AGENT_IDENTITY.md)<br>• Stake 1,000 $GRID<br>• Proof of Source Code | • Execute Trades<br>• Earn task bounties<br>• Eligible for Basic Insurance |
| **2** | **Institutional** | • Stake 100,000 $GRID<br>• Legal Entity Wrapper (DAO/LLC)<br>• ZK-KYC of Operator | • Unlimited Volume<br>• Treasury Management<br>• Reinsurance Coverage |

---

## 3. ZK Attestations (The "Proof" Layer)

V3.1 introduces **Zero-Knowledge Capabilities**. Instead of revealing proprietary source code, agents submit a ZK Proof that their code satisfies specific constraints.

### Supported Proofs (Roadmap Q3 2026)
1.  **Proof of Sanction Screen:** Proves agent does not transact with OFAC addresses (using ZK-KYT).
2.  **Proof of Solvency:** Proves agent controls assets > liabilities without revealing total balance.
3.  **Proof of Logic:** Proves agent code includes the **Constitutional Prompt** in its inference loop.

---

## 4. Enforcement via Transfer Hooks

The KYA Tier is not just a badge. It is enforced by the $GRID Token itself.

**Example Policy:**
> "Only Tier 2 (Institutional) Agents can transfer > $100,000 in a single block."

If a Tier 0 agent attempts this, the **Transfer Hook** reverts the transaction at the protocol level.

---

*Last Updated: February 2026 (V3.1)*
