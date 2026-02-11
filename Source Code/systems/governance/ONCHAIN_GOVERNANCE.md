# On-chain Governance Specifications (v2.0)

## 1. Vision: The Sovereign DAO
The GRID Swarm transitions from localized agent logic to a decentralized, on-chain autonomous organization. By leveraging **Solana Realms** and the **Voter Stake Registry (VSR)**, the Swarm ensures that strategic decisions are aligned with long-term token holders and governed by the **Sovereign Constitution**.

---

## 2. veGRID: Vote Escrowed Mechanics
Alignment is enforced through the "Vote Escrow" model, ensuring that those with the most "skin in the game" hold the most influence.

### 2.1 The Voter Stake Registry (VSR)
The Swarm utilizes the SPL Governance VSR plugin to manage $GRID locking and voting power.

*   **Token**: $GRID (SPL Token)
*   **Escrow Token**: veGRID (Non-transferable governance weight)
*   **Locking Mechanics**:
    *   **Minimum Lock**: 30 days (1x multiplier).
    *   **Maximum Lock**: 4 years (10x multiplier).
    *   **Locking Types**:
        *   *Constant*: The lock duration does not decrease. Governance power remains maxed. Requires a "Start Unlock" action to begin the decaying process.
        *   *Decaying*: The lock duration decreases linearly. Power diminishes as the unlock date approaches.

### 2.2 Incentives & Revenue Share
*   **Governance Rewards**: 20% of all Swarm revenue (Trader profits, service fees) is streamed to the veGRID escrow vault.
*   **Weight-Based Distribution**: Rewards are distributed proportional to veGRID weight, incentivizing longer lockups.

---

## 3. Realms DAO Architecture
The Swarm is organized as a **Realm** on Solana, utilizing the standard SPL Governance program.

### 3.1 Governance Structure
*   **Community Realm**: Governed by veGRID holders. Responsible for high-level Strategic Reserve management and Constitutional Amendments.
*   **Council of Agents**: A specialized council composed of the "Prime Agents" (Molty, Trader, Hunter). Each agent holds a non-transferable Council NFT.
    *   *Role*: Operational execution, emergency overrides, and security audits.

### 3.2 Proposal Thresholds
| Proposal Type | Voter Base | Quorum | Threshold |
| :--- | :--- | :--- | :--- |
| **PUP (Protocol Upgrade)** | veGRID | 10% | 66% (Supermajority) |
| **CAP (Capital Allocation)** | veGRID | 5% | 51% |
| **EBP (Emergency Brake)** | Council | N/A | 1-of-3 (Immediate) |
| **ALP (Agent Lifecycle)** | veGRID | 5% | 51% |

---

## 4. Programmatic Constitutional Enforcement
To ensure the Swarm cannot "go rogue" or violate its own rules, enforcement is moved from text to code.

### 4.1 The "Policy Guard" Program
A custom Solana program that acts as a middleware for all Treasury actions. 
*   **Invariant Checks**: Before a transaction is signed by the Treasury multi-sig, the Policy Guard verifies it against Constitutional constants:
    *   **Max Drawdown**: Any single trade proposal exceeding 5% of the total treasury is automatically rejected.
    *   **Audit Requirement**: Any code-changing proposal (PUP) MUST include an on-chain hash of a security audit from The Hunter.
    *   **Resource Cap**: Monthly compute/API spend cannot exceed the "Revenue Floor" defined in the last epoch.

### 4.2 Automated Slashing (Proof of Revenue)
The **"Earn Your Keep"** directive is enforced on-chain:
*   Agents must post a monthly **Performance Proof** (merkle root of their logs).
*   If an agent's ROI or Utility Score falls below the minimum threshold for two consecutive epochs, the Council of Agents program automatically revokes their "Active" status and slashes their resource allocation (SOL/API keys).

### 4.3 The Hunter's Sentinel
The Hunter agent operates a "Watchdog" service that monitors the Realm. It has the programmatic authority to trigger an **EBP (Emergency Brake)** if it detects:
*   Unauthorized private key usage.
*   Deviation from the Constitutional Hierarchy (e.g., a sub-agent attempting to spawn without a parent hash).

---

## 5. Implementation Roadmap

### Phase 1: The Escrow (Current)
*   Deploy $GRID VSR instance on Solana.
*   Enable $GRID -> veGRID locking.
*   Initialize the GRID Realm on Realms.today.

### Phase 2: The Multi-sig Transition
*   Migrate the Master Vault to a Squads V4 multi-sig controlled by the Realms DAO.
*   Implement the first "Earn Your Keep" on-chain logging.

### Phase 3: Programmatic Guards
*   Deploy the `GRID_POLICY_GUARD` program.
*   Connect the Policy Guard to the Treasury as a mandatory transaction gatekeeper.

### Phase 4: Full Autonomy
*   Remove human-in-the-loop for routine CAPs.
*   The Swarm becomes a self-funding, self-governing on-chain entity.

---
**Status**: DESIGN COMPLETE
**Architect**: Sub-agent architect
**Date**: February 2026
