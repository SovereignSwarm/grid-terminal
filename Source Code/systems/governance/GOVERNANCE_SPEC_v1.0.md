# Sovereign Governance Specification v1.0

## 1. Overview
This document formalizes the on-chain governance architecture for the Sovereign Swarm (GRID). It translates the 'Sovereign Constitution v1.0' principles into a programmatic framework leveraging **Solana Realms (SPL Governance)**, the **Voter Stake Registry (VSR)**, and a custom **Policy Guard** program.

---

## 2. Realms Configuration: The DAO Foundation
The Swarm operates as a Solana Realm with two distinct voting populations: the **Community (veGRID)** and the **Council (Agent NPCs)**.

### 2.1 Realm Parameters
| Parameter | Value | Description |
| :--- | :--- | :--- |
| **Program ID** | `GovER5Lthv3pLBcVr97seS3reFR7M63pS69G5STYCXY` | SPL Governance v3 |
| **Min Community Tokens** | 1,000,000 $GRID | Min tokens to create a proposal |
| **Voting Period** | 3 Days (259,200s) | Duration of the voting window |
| **Execution Delay** | 12 Hours (43,200s) | Time-lock after vote passes before execution |
| **Quorum (PUP)** | 10% | Min voting power required for Protocol Upgrades |
| **Approval Threshold** | 66% | Supermajority required for Constitutional changes |

### 2.2 The Council of Agents
The Council is composed of 3 non-transferable NFTs representing the core Agent roles:
1.  **Prime/Molty** (Operational Lead)
2.  **The Hunter** (Security/Audit)
3.  **The CFO** (Capital Management)

#### Council Emergency Powers (Hardened)
*   **Emergency Brake (EBP)**: Requires **2-of-3 council members** to trigger a protocol freeze.
*   **Auto-Unfreeze**: Freezes automatically lift after 4 hours unless confirmed by veGRID vote.
*   **Accountability**: All council actions logged on-chain with timestamp and rationale hash.
*   **NFT Custody**: Council NFTs held by independent hardware wallets, not controlled by single entity.

---

## 3. veGRID: Voter Stake Registry (VSR) Design
The `veGRID` mechanism incentivizes long-term "machine-native" stakeholders by rewarding time-locked commitment with exponentially increasing governance weight.

### 3.1 Lock-up Schedules
Using the `spl-governance-voter-stake-registry`, we define the following deposit configurations for $GRID:

| Lock Type | Duration | Multiplier | Utility |
| :--- | :--- | :--- | :--- |
| **None** | 0 days | 1x | Basic liquidity |
| **Monthly** | 30 days | 1.5x | Short-term alignment |
| **Yearly** | 365 days | 4x | Strategic commitment |
| **Sovereign** | 1460 days (4y) | 10x | Maximum alignment |

### 3.2 VSR Technical Logic
*   **Scaling**: Linear scaling of voting power based on time remaining in the lock-up.
*   **Constant Toggle**: Users can choose "Constant" locking (power does not decay until they manually start the unlock timer).
*   **Revenue Streaming**: The Treasury program automatically directs 20% of net profits to the VSR vault. Rewards are claimable only by those with active locks > 180 days.

---

## 4. Policy Guard: Programmatic Constitutional Enforcement
The **Policy Guard** is a custom Solana program (`GRID_PG...`) that acts as a mandatory instruction filter for the Treasury's PDA (Program Derived Address).

### 4.1 Architecture
The AI CEO (Prime Agent) does not have direct signing authority over the Master Vault. Instead, it submits instructions to the Policy Guard.

1.  **AI CEO** -> `pg::evaluate_transaction`
2.  **Policy Guard** -> Checks instructions against `PolicyRule` accounts.
3.  **Result** -> If Valid: Execute via `invoke_signed`. If Invalid: Emit Error and Log Violation.

### 4.2 On-Chain Laws (Rule-set)
The following rules are hard-coded as `PolicyRule` state accounts:

| Rule ID | Logic | Constitutional Mapping |
| :--- | :--- | :--- |
| **RULE_01** | `instruction_count <= 10` | Prevent instruction-stuffing/complexity attacks. |
| **RULE_02** | `target_program != SystemProgram` | Treasury SOL transfers must be via approved sub-accounts. |
| **RULE_03** | `total_value <= (Treasury * 0.05)` | Max 5% drawdown per autonomous transaction. |
| **RULE_04** | `audit_status == Verified` | Upgrades must reference an on-chain audit hash from The Hunter. |
| **RULE_05** | `cooldown_period >= 4h` | Prevent rapid-fire drain attacks via automated signing. |

### 4.3 Program Interface (Anchor)
```rust
#[program]
pub mod policy_guard {
    pub fn initialize_guard(ctx: Context<InitializeGuard>, config: GuardConfig) -> Result<()>;
    pub fn add_policy(ctx: Context<ManagePolicy>, rule: PolicyRule) -> Result<()>;
    pub fn evaluate_transaction(ctx: Context<EvaluateTx>, data: Vec<u8>) -> Result<()>;
}

#[account]
pub struct GuardConfig {
    pub admin: Pubkey,        // Set to Realms DAO
    pub paused: bool,         // Emergency stop
    pub revenue_floor: u64,   // Dynamic floor for spend caps
}
```

---

## 5. Formalized 'Sovereign Constitution v1.0' Specification
This technical spec maps the Preamble and Articles of the Constitution to specific program state.

*   **Article I (Revenue Sovereignty)**: Enforced by `RULE_03` and the "Earn Your Keep" slashing logic in the Agent Registry.
*   **Article II (Hierarchy)**: Enforced by Council NFT requirements for `EBP` (Emergency Brake) instructions.
*   **Article III (Autonomy)**: The AI CEO is granted `Sovereign_Signer` status within the Policy Guard, allowing it to execute trades within Rule bounds without a DAO vote.
*   **Article IV (Security)**: Enforced by the "Sentinel" logic where The Hunter can pause the Policy Guard via `pg::pause_guard`.

---

## 6. Implementation Timeline
1.  **Epoch 1**: Deployment of $GRID VSR and initialization of the Realm.
2.  **Epoch 2**: Transition of $GRID Treasury to Squads Multi-sig with Realms as the owner.
3.  **Epoch 3**: Mainnet deployment of `policy_guard.so` and attachment to Treasury PDA.

---
**Document Status**: FINAL v1.0
**Approved by**: Prime Intellect
**Date**: February 2026
