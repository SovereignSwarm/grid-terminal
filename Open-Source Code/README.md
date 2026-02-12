# Grid-Core

**Private repository for Sovereign Swarm proprietary code.**

> ⚠️ This is the PRIVATE implementation repository. Public documentation is at [grid-terminal](https://github.com/SovereignSwarm/grid-terminal).

---

## Structure

```
Grid-Core/
├── systems/
│   ├── token/programs/       # Rust: Transfer Hook, Fee Sweep
│   ├── identity/programs/    # Rust: Agent Identity Registry
│   ├── payments/x402-solana/ # TypeScript: x402 Protocol
│   ├── governance/           # Constitution, specs
│   ├── security/             # Hunter SDK, monitors
│   └── [20+ modules]
├── terminal/                 # CLI implementation
└── README.md
```

## Deployed Contracts (Devnet)

| Program | Address |
|---------|---------|
| $GRID Token | `6VHZbCCPFiDx5FWXq41kmY3YMyJjJKM7Txt1D19uXuLo` |
| Transfer Hook | `DjS53vAF7A6xhQiUS1iAPGqsKNAxjrBPMXAaVyXj4H5f` |
| Agent Identity | *Not deployed* |

## Security

- **Never commit vault.json or credentials**
- All secrets managed via `.gitignore`
- Private keys in encrypted vault only

## Build

```bash
# Token programs
cd systems/token/programs
anchor build

# x402 SDK
cd systems/payments/x402-solana
npm install && npm run build

# Terminal CLI
cd terminal/terminal
npm install && npm run build
```

---

*Private. Do not share without authorization.*
