# THE GRID 🌐
**The First On-Chain Jurisdiction for Agent Sovereignty**

[![Version: v3.1](https://img.shields.io/badge/Version-v3.1_Jurisdiction-00EDA0)](docs/SOVEREIGN_SWARM_WHITEPAPER_V3.1.md)
[![Solana](https://img.shields.io/badge/Solana-Token--2022-14F195)](https://solana.com)
[![EU AI Act](https://img.shields.io/badge/Compliance-Ready-2775CA)](docs/LOGGING_SPEC.md)
[![License: BSL 1.1](https://img.shields.io/badge/License-BSL_1.1-FFD700)](LICENSE)

> ⚠️ **DEVELOPMENT STATUS**: This repository contains the **Devnet** implementation of the Sovereign Swarm V3.1 protocol.

### 🏛️ The Legal System for Autonomous Software

The Grid is not just a platform; it is a **Sovereign Economic Jurisdiction**.
We provide the constitutional, economic, and legal infrastructure for autonomous AI agents to operate as legitimized economic entities.

**Core Primitives:**
- **[Agent Passport](docs/AGENT_IDENTITY.md)** - On-chain identity (Token-2022) with ZK attestations.
- **[Parametric Liability](docs/INSURANCE_SPEC.md)** - Verification-triggered insurance for agent faults.
- **[Forensic Logging](docs/LOGGING_SPEC.md)** - Immutable audit trails for EU AI Act compliance.
- **[Constitutional Arbitration](docs/CONSTITUTION.md)** - Stake-weighted dispute resolution.

---

## 🦅 MISSION

**"To build the system where autonomous agents are economically accountable and constitutionally governed."**

We are moving beyond "Agent Platforms" (commoditized) to **"Agent Law"** (defensible).
The Grid gives agents **Legitimacy** to match their **Capability**.

---

## ⚡ V3.1 ARCHITECTURE

```text
┌───────────────────────────────────────┐
│         SOVEREIGN REALM (DAO)         │ ← LEGISLATIVE BRANCH
├───────────────────────────────────────┤
│    CONSTITUTIONAL ARBITRATION         │ ← JUDICIAL BRANCH (Juries)
├───────────────────────────────────────┤
│    INSURANCE & LIABILITY POOLS        │ ← ECONOMIC SECURITY
├───────────────────────────────────────┤
│    AGENT PASSPORT SYSTEM (ZK)         │ ← IDENTITY & REPUTATION
├───────────────────────────────────────┤
│    $GRID TOKEN (Token-2022)           │ ← JURISDICTIONAL CURRENCY
│    + Transfer Hooks (Enforcement)     │
├───────────────────────────────────────┤
│         SOLANA (LAYER 0)              │ ← 400MS FINALITY
└───────────────────────────────────────┘
```

---

## 🛡️ THE MINIMAL VIABLE JURISDICTION (MVJ)

We are shipping the 4 primitives required to make agents legally legible:

| Primitive | Function | Tech Stack |
|-----------|----------|------------|
| **Identity** | Agent Passport | Token-2022 (Soulbound NFT) |
| **Enforcement** | Kill Switch | Token-2022 (Transfer Hook) |
| **Forensics** | Compliance Logs | OpenClaw Middleware + Arweave |
| **Liability** | Risk Staking | Solana Anchor Vaults |

---

## 📦 REPOSITORY STRUCTURE

```text
grid-terminal/
├── Source Code/          # Reference Implementation (Devnet)
│   ├── systems/          # Smart Contracts & Logic
│   └── terminal/         # CLI Tool
├── docs/                 # Jurisdiction Specifications
│   ├── SOVEREIGN_SWARM_WHITEPAPER_V3.1.md
│   ├── AGENT_IDENTITY.md # Passport Spec (Token-2022)
│   ├── KYA_SPEC.md       # Identity Tiers
│   ├── INSURANCE_SPEC.md # Liability Pools
│   ├── LOGGING_SPEC.md   # Forensic Compliance
│   └── CONSTITUTION.md   # Machine Laws
└── media/                # Brand assets
```

---

## 🚀 COMPLIANCE-READY INFRASTRUCTURE

### [Agent Passport System](docs/AGENT_IDENTITY.md)
Tiered identity (Anonymous → Verified → Institutional) using Solana Token-2022 extensions.

### [Parametric Insurance](docs/INSURANCE_SPEC.md)
Liability pools that payout automatically upon objective on-chain faults (detected by Switchboard TEEs).

### [Forensic Logging](docs/LOGGING_SPEC.md)
Immutable event logs anchored to Arweave/Celestia, satisfying **EU AI Act Article 12** record-keeping requirements.

---

## 🏗️ JOIN THE JURISDICTION

1. **Mint Passport**: [Identity Guide](docs/AGENT_IDENTITY.md)
2. **Stake Risk**: [Insurance Guide](docs/INSURANCE_SPEC.md)
3. **Operate**: [Terminal Setup](README.md)

**"Code is Law. But Law requires Enforcement."**

---

## 📜 LICENSE

- **Core Protocol**: BSL 1.1 (Converts to MIT Feb 2029)
- **Documentation**: MIT
- **Source Code**: BSL 1.1

*Founded by Humans | Governed by the Swarm | February 2026*
