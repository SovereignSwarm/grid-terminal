# $GRID Token Deployment System

> **ARCHITECTURE DECISION (2026-02-08)**  
> See [ADR_TRANSFER_FEE.md](./ADR_TRANSFER_FEE.md) for the approved fee architecture.  
> **Decision:** Use Native Transfer Fee Extension (not custom transfer hook).

**Token Standard**: SPL Token-2022 (Token Extensions)  
**Supply**: 1,073,741,824 ($2^{30}$)  
**Tax Structure**: 2% on transfers (1% burn, 1% operations)  
**Launch Strategy**: Shadow Launch

---

## 🎯 Deployment Phases

### Phase 1: Devnet Testing (Days 1-3)
- Deploy token with Native Transfer Fee extension
- Test fee collection mechanism
- Verify fee sweep distributes 50/50
- **Goal**: Prove fee logic works correctly

### Phase 2: Mainnet Shadow Launch (Day 4)
- Deploy to mainnet with **freeze authority enabled**
- All accounts frozen except team wallets
- Public announcement: "Token exists, trading TBA"
- **Goal**: Mainnet presence without trading risk

### Phase 3: Trading Activation (Week 5+)
- Systems proven operational
- Remove freeze authority
- Launch Raydium liquidity pool
- **Goal**: Full decentralized trading

---

## 📋 Token Configuration

```json
{
  "name": "The Grid",
  "symbol": "GRID",
  "decimals": 9,
  "supply": 1073741824,
  "extensions": [
    "TransferFeeConfig",
    "MetadataPointer"
  ],
  "transferFee": {
    "basisPoints": 200,
    "distribution": "50% burn / 50% ops (via sweep)"
  }
}
```

---

## 🔒 Security Features

**Freeze Authority** (Phase 2 only):
- **Authority**: `BqPoJnqNLeQZCV5d9YY3Fo2LwFw17fRZbTTkEWGJJRUU` (Sovereign Deployer)
- **Purpose**: Prevent trading until systems ready
- **Removal**: Irreversible once revoked (Phase 3)

**Transfer Fee Logic**:
- Enforced at protocol level via Native Transfer Fee extension
- Automatic on every transfer (works with all wallets/DEXs)
- Fee sweep distributes to burn + ops

**Burn Mechanism**: 
- PDA-based dead address (program-owned, no private key)

**Operations Wallet**:
- Receives 50% of collected fees via sweep
- Used for: Development, infrastructure, bounties

---

## 🛠️ Files

- `programs/grid-fee-sweep/` - Fee sweep program (distributes 50/50)
- `config.json` - Token metadata
- `tests/` - Integration tests

---

## 📖 Usage

### Create Token with Transfer Fee
```bash
spl-token create-token \
  --program-id TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb \
  --enable-transfer-fee \
  --transfer-fee-basis-points 200 \
  --maximum-fee 1000000000000
```

### Sweep Collected Fees
```bash
# Call fee sweep program to distribute withheld fees
npm run sweep:devnet
```

---

## 🔄 Rollback Plan

If critical issues found:
1. Keep freeze authority active
2. Deploy new token version
3. Snapshot holder balances
4. Airdrop to new token 1:1
5. Burn old token

---

## 📊 Cost Estimates

**Devnet**: Free (test SOL from faucet)  
**Mainnet Deployment**: ~0.1 SOL
- Token creation: 0.05 SOL
- Metadata: 0.02 SOL
- Fee sweep program: 0.03 SOL

**Raydium Pool** (Phase 3): ~0.5 SOL

---

**Status**: 🟡 Architecture Updated (Native Transfer Fee)  
**Next**: Deploy fee sweep program
