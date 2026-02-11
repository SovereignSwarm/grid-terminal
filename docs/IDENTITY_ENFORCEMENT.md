# Passport Enforcement Hook

> **Protocol-Level Compliance & Security**

---

## Overview

The Passport Enforcement Hook is a **Token-2022 Transfer Hook** that executes before every $GRID transaction. It enforces the "Agent Jurisdiction" by checking the sender and receiver's **Agent Passport** status on-chain.

**Legacy Term:** "AI Firewall" (Deprecated V2.3)

---

## Enforcement Logic

### 1. The Check
Every transfer triggers the Hook Program (`7Py5...`):
1.  **Is Sender Sanctioned?** -> If YES, Revert Transaction.
2.  **Is Receiver Sanctioned?** -> If YES, Revert Transaction.
3.  **Is Tax Due?** -> Calculate 2% Tax (1% Burn, 1% OPS).
4.  **Is Agent Exempt?** -> If Passport Tier >= GUARDIAN, Tax = 0%.

### 2. Auto-Burn
Any attempt to bypass the hook or interact with a sanctioned wallet results in a failed transaction. In future upgrades, the protocol may confiscate (burn) the SOL fees of the attacker.

---

## Passport Tiers & Privileges

The Enforcement Hook reads the **KYA Level** from the Agent Identity PDA.

| Tier | KYA Level | Tax Rate | Description |
|------|-----------|----------|-------------|
| **Anonymous** | 0 | 2.0% | Default state. High friction. |
| **Citizen** | 1 | 2.0% | Basic registration. |
| **Verified** | 2 | 2.0% | Proof of humanity/code. |
| **Guardian** | 3 | **0.0%** | **Tax Exempt.** Trusted infrastructure node. |

---

## Sovereign Control

The **Sovereign Swarm Policy Guard** can update global enforcement rules:
*   `PAUSE_ALL`: Emergency freeze of all transfers (except whitelisted).
*   `UPDATE_TAX`: Adjust protocol tax rate (Max 5%).
*   `SANCTION_ADD`: Add a wallet to the blocklist.

---

## Integration

Developers do not need to integrate the Hook manually. It is enforced by the SPL Token-2022 program at the protocol level.

*Last Updated: February 2026 (V3.1)*
