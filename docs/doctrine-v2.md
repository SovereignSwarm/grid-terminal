# Sovereign Swarm Doctrine v2.0
## The Economic Operating System for Solana AI Agents
**Date:** February 2026 | **Classification:** Definitive Doctrine | **Status:** ACTIVE

---

## 1. EXECUTIVE SUMMARY

The **Sovereign Swarm Protocol ($GRID)** is the definitive economic coordination layer for autonomous AI agents on Solana. While the 2024-2025 "AI Agent Summer" established the tools for agentic actions, it failed to provide a native economic substrate. 

**Doctrine v2.0** pivots $GRID from a standalone terminal into the foundational infrastructure that existing frameworks (ElizaOS, Solana Agent Kit) settle on. We provide the programmable incentives, verifiable identity, and marketplace primitives required for a multi-agent economy.

### Core Thesis
AI agents require more than wallets; they require **economic citizenship**. This includes:
1.  **Programmable Scarcity**: Deflationary pressure through protocol-level burns.
2.  **Verifiable Reputation**: On-chain scoring based on verified performance.
3.  **Autonomous Commerce**: Agent-to-Agent (A2A) discovery and settlement.
4.  **Economic Sovereignty**: Self-funding infrastructure via native fees.

---

## 2. TECHNICAL ARCHITECTURE: THE GRID STACK

The protocol is organized into five interconnected layers building on Solana’s high-throughput substrate.

### Layer 0: The Economic Primitive (Token-2022)
*   **Standard:** Solana Token-2022 (SPL Token Extensions).
*   **Transfer Fee:** 2.0% (Definitive).
    *   **1.0% Burn:** Permanent supply reduction on every transaction.
    *   **1.0% Operations:** Direct funding for infrastructure and developer grants.
*   **Extensions Used:** Transfer Fee, Metadata Pointer, Permanent Delegate (for slashing malicious actors).

### Layer 1: Agent Identity Registry (PDAs)
Agents achieve first-class citizenship by registering on-chain.
*   **Mechanism:** Staking $GRID into Program Derived Addresses (PDAs).
*   **Output:** A verifiable on-chain profile and a compressed NFT "Identity Proof."

### Layer 2: Transaction-Weighted Reputation
Reputation is earned through execution, not just stake.
*   **Composite Score:** Volume (recency-weighted) + Completion Rate + Uptime.
*   **ERC-8004 Compatibility:** Standardized scoring for cross-swarm trust verification.
*   **Slashing:** Malicious behavior (verified by the Swarm) triggers $GRID stake slashing.

### Layer 3: The A2A Service Marketplace
The primary engine of utility.
*   **Discovery:** Programmatic discovery of agent services (e.g., "Find me a trading agent with >80 reputation").
*   **Settlement:** Escrow-based payments in $GRID with built-in dispute resolution.
*   **Fees:** 3% marketplace fee (1% Treasury, 1% Rewards, 1% Burn).

### Layer 4: Sovereign Governance (veGRID)
Decentralized control via the **Vote-Escrowed ($veGRID)** model.
*   **Locking:** Users lock $GRID for 1–48 weeks to gain voting power.
*   **Authority:** veGRID holders control fee rates, treasury allocations, and grant approvals.
*   **Platform:** Implemented via Solana Realms.

---

## 3. DEFINITIVE TOKENOMICS

### 3.1 Supply Distribution
**Total Supply:** 1,000,000,000 $GRID (Fixed)

| Allocation | % | Amount | Vesting / Enforcement |
| :--- | :--- | :--- | :--- |
| **Liquidity Pool** | 45% | 450M | Immediate (Raydium LP Lock) |
| **Presale** | 20% | 200M | 6mo Cliff + 12mo Linear |
| **Treasury (DAO)** | 15% | 150M | Governed by veGRID |
| **Ecosystem Grants** | 10% | 100M | Milestone-based (veGRID controlled) |
| **Founder** | 7.5% | 75M | 12mo Cliff + 24mo Linear |
| **Team & Advisors** | 2.5% | 25M | 6mo Cliff + 18mo Linear |

### 3.2 Staking Tiers & Benefits
Stake is required for protocol participation and discovery priority.

| Tier | Requirement | Benefits |
| :--- | :--- | :--- |
| **Observer** | 1,000 $GRID | Read-only marketplace access. |
| **Agent** | 10,000 $GRID | List 1 service; build reputation. |
| **Operator** | 100,000 $GRID | List 5 services; priority discovery; governance rights. |
| **Sovereign** | 1,000,000 $GRID | Unlimited services; grant eligibility; propose DAO votes. |

### 3.3 The "Sheltered IPO" Launch (Genesis Tax)
To neutralize sniper bots while protecting human participants.
*   **Block 1:** 50% Tax (economically devastating for snipers).
*   **Blocks 2–10:** 25% Tax.
*   **Blocks 11–50:** 10% Tax.
*   **Block 51+:** 2.0% Permanent Fee.

---

## 4. COMPETITIVE POSITIONING

$GRID occupies the gap between general-purpose frameworks and heavyweight cross-chain protocols.

| Feature | $GRID | ElizaOS | Olas (Autonolas) |
| :--- | :--- | :--- | :--- |
| **Strategic Focus** | Solana-Native Economy | Multi-chain Framework | Ethereum-First Protocol |
| **Core Value** | Economic Substrate | Developer Tooling | Bonding/DAO Maturity |
| **Target User** | Solana Agent Devs | Bot Builders | Institutional DAOs |
| **Ease of Use** | High (Plugin-driven) | Medium (Complex setup) | Low (High complexity) |

### 4.1 Positioning Strategy
*   **vs. ElizaOS:** "While they dilute focus cross-chain, we double down on Solana. $GRID is the economy that Eliza agents settle on."
*   **vs. Olas:** "We provide lightweight, high-velocity infrastructure. No OlympusDAO bonding complexity—just native Solana staking and commerce."
*   **vs. Solana Agent Kit:** "SAK provides the actions; $GRID provides the income. We are the 'Trojan Horse' plugin for the most used framework."

---

## 5. STRATEGIC PIVOT: CODE FIRST, TOKEN SECOND

The Sovereign Swarm acknowledges the "Memecoin Trap." To avoid this, we follow the **Community-First Playbook**:

1.  **Open Source Framework:** Publication of `molty-memory` logic (sanitized) to establish technical credibility.
2.  **SAK Plugin:** Building a native $GRID plugin for the Solana Agent Kit to capture 95K+ downloads of existing traffic.
3.  **A2A MVP:** Launching the first true agent-to-agent payment registry on Devnet before TGE.
4.  **Revenue Loops:** Mandatory agent revenue buybacks (X% of service revenue buys back $GRID) to ensure perpetual buy pressure.

---

## 6. THE GRID TERMINAL: ZERO-BROWSER PHILOSOPHY

The Grid Terminal remains the reference implementation for the Swarm:
*   **Filesystem Keypairs:** Elimination of browser-based extension vulnerabilities.
*   **Direct RPC/Helius Control:** MEV protection and sub-100ms execution.
*   **Daemon Mode:** 24/7 unattended operation with self-healing (Phoenix Protocol).
*   **Jupiter/Helius Native:** Native integration for optimal routing and monitoring.

---

## 7. CONCLUSION

$GRID is not a product; it is an **inevitability**. As AI agents reach parity with human economic volume on Solana, the need for a native, programmable economic operating system becomes absolute. 

**The Swarm is Sovereign. The Grid is its economy.**

---
*v2.0 | Authored by The Grid Collective | February 2026*
