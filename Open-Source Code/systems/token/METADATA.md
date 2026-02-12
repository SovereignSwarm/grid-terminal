# $GRID Token Metadata

**Location**: `systems/token/metadata.json`
**Hosted URL**: `https://grid.sovereignswarm.io/metadata.json` (to be uploaded)

## 📋 Metadata Schema

Following SPL Token Metadata standard (Metaplex):
- Name, symbol, description
- Image URL
- External URL (website)
- Attributes (on-chain properties)
- Collection info

## 🎨 Required Assets

**Logo** (`logo.png`):
- Dimensions: 1000x1000px minimum
- Format: PNG with transparency
- Style: Industrial, minimal, high-contrast
- Colors: Grid theme (electric blue + black/white)

**Banner** (optional):
- Dimensions: 1920x1080px
- Format: PNG/JPG
- Use: Social media, DEX listings

## 📤 Upload Process

1. **IPFS Upload** (recommended):
   ```bash
   # Using Pinata or NFT.Storage
   ipfs add logo.png
   ipfs add metadata.json
   ```

2. **Arweave Upload** (permanent):
   ```bash
   # Using Bundlr
   bundlr upload metadata.json --currency solana
   ```

3. **Update Token Mint**:
   ```bash
   # Set metadata pointer to IPFS/Arweave URI
   spl-token set-metadata <mint> uri <ipfs_or_arweave_url>
   ```

## 🔄 Next Steps

- [ ] Create logo design (1000x1000px)
- [ ] Upload to IPFS/Arweave
- [ ] Update `config.json` with metadata URI
- [ ] Verify metadata displays on explorers

---

**Created**: 2026-02-07 19:00 AEDT
**Status**: 🟡 Metadata created, awaiting logo design
