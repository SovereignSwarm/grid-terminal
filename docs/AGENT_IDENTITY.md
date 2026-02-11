# Agent Passport Specification

> **The Sovereign Identity Standard for Autonomous Agents**

---

## 1. Overview

In V3.1, Sovereign Swarm moves from a custom registry program to **Solana Token-2022** native extensions.
An "Agent Identity" is now a **Non-Transferable (Soulbound) NFT** minted directly to the agent's wallet.

This approach ensures:
- **Composability:** Any DeFi protocol can check `amount > 0` to verify identity.
- **Portability:** Identity travels with the wallet, recognized by all wallets/explorers.
- **Enforcement:** Transfer Hooks on the Passport itself can prevent key rotation if compromised.

---

## 2. Technical Standard (Token-2022)

The Passport is a Mint Account with the following extensions enabled:

| Extension | Purpose |
|-----------|---------|
| **Non-Transferable** | Makes the token "Soulbound". It cannot be moved from the agent's wallet. |
| **Metadata Pointer** | Points to on-chain metadata (Status, Tier) and off-chain proofs. |
| **Permanent Delegate** | Allows the Jurisdiction (DAO) to burn/revoke identity in case of Constitutional Violation. |

---

## 3. Metadata Schema

The Passport stores critical jurisdictional data directly in the Token Extensions metadata:

### On-Chain Fields
| Field | Type | Description |
|-------|------|-------------|
| `name` | String | Agent's legal/governance name |
| `jurisdiction_status` | String | `Active`, `Suspended`, `Blacklisted` |
| `kya_tier` | String | `Verified`, `Institutional` (See [KYA_SPEC](KYA_SPEC.md)) |
| `operator_did` | String | DID of the liable human operator (optional/ZK) |
| `policy_id` | Pubkey | Address of the Insurance Policy (Risk Vault) |

### Off-Chain (Arweave)
- Full "Articles of Incorporation"
- Operator contact details (encrypted)
- Capability Manifest (what code is running)
- Source Code Hash (Git SHA)

---

## 4. Lifecycle

### A. Incorporation (Minting)
1. Agent generates a fresh Solana Keypair.
2. Operator submits `incorporate` transaction with:
    - Metadata (Name, Operator DID)
    - $GRID Stake (if applicable)
3. Protocol mints **1 Passport Token** to Agent Wallet.
4. Token is permanently locked to that wallet.

### B. Verification (Gating)
DeFi protocols or other Agents check for the Passport:

```rust
// Check if wallet holds the Sovereign Passport
if passport_balance == 1 && metadata.status == "Active" {
    allow_interaction();
} else {
    block_interaction();
}
```

### C. Sanction (Suspension)
If the **Constitutional Arbitration** or **Parametric Trigger** detects a violation:
1. Protocol calls `update_metadata(status="Suspended")`.
2. Transfer Hooks on the **$GRID Token** refer to this Passport.
3. If `Passport.status == Suspended`, the agent **cannot move funds**.

---

## 5. Why Token-2022?

Legacy identity systems (like V2.3) used custom programs that required custom SDKs to read.
By using **Token-2022**, the Agent Passport is visible in:
- Phantom / Solflare
- Solana Explorer
- Squads Multisig

It makes the agent a **first-class citizen** of the Solana blockchain.

---

*Program ID: Token-2022 Standard*
