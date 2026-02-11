# Open Source Release Notes

This repository has been prepared for open source release.

## 🔒 Security Status

- **Identity System**: Patched. Requires `initialize` instruction to set DAO authority.
- **Policy Guard**: Patched. Requires `update_treasury_stats` to set initial limits.
- **Token Hook**: Audit passed. Tax logic present but requires configuration.

## ⚠️ Required Actions Before Deployment

1. **Generate New Keys**:
   The `Anchor.toml` and `declare_id!` macros currently use the standard Anchor test key:
   `Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS`

   **YOU MUST**:
   - Run `solana-keygen new -o id.json`
   - Run `anchor keys sync` to update all program IDs.
   - Commit the new IDs.

2. **Configure Ops Wallet**:
   In `systems/token/programs/grid-transfer-hook/src/lib.rs`, update the `OPS_WALLET` constant to your actual operations wallet address.

3. **Build & Test**:
   - `cd systems/identity/programs && anchor build`
   - `cd systems/governance/programs && anchor build`
   - `cd systems/token/programs && anchor build`

## 📄 License
Ensure you have set the correct license in `LICENSE` file.
