# 🦅 CREATE $GRID TOKEN MINT WITH NATIVE TRANSFER FEE

> **Architecture:** Native Token-2022 Transfer Fee Extension  
> See [ADR_TRANSFER_FEE.md](../ADR_TRANSFER_FEE.md) for decision rationale.

**Cluster**: Devnet  
**Token Standard**: Token-2022 with Transfer Fee Extension  
**Tax**: 2% (withheld, then swept 50% burn / 50% ops)

---

## 🎯 PREREQUISITES

### 1. Solana Wallet
- **Required**: ~0.5 SOL balance on devnet
- **Keypair**: Default Solana CLI wallet (`~/.config/solana/id.json`)

### 2. Environment
- **Solana CLI**: `solana --version` (2.0.0+)
- **RPC URL**: `https://api.devnet.solana.com`

### 3. Accounts Needed
- **Token Mint**: New mint with Transfer Fee extension
- **Withdraw Authority**: Controls fee collection
- **Operations Wallet**: Receives 50% of swept fees
- **Burn PDA**: Receives 50% of swept fees (dead address)

---

## 📋 STEP-BY-STEP GUIDE

### Step 1: Create Token Mint with Transfer Fee Extension

```bash
# Create mint with Native Transfer Fee
spl-token create-token \
  --program-id TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb \
  --decimals 9 \
  --enable-transfer-fee \
  --transfer-fee-basis-points 200 \
  --maximum-fee 1000000000000
```

**Expected Output**:
```
Creating token A1b2C3d4E5f6G7h8I9j0K1l2M3n4O5p6Q7r8S9t0...
Address: <MINT_ADDRESS>
```

**Save the Mint Address**: This is your $GRID token mint.

---

### Step 2: Initialize Token Metadata

```bash
spl-token initialize-metadata \
  <MINT_ADDRESS> \
  "The Grid" \
  "GRID" \
  "https://raw.githubusercontent.com/SovereignSwarm/grid-terminal/main/assets/grid-logo.png"
```

---

### Step 3: Create Operations Wallet

```bash
# Generate keypair for operations wallet
solana-keygen new --no-passphrase -o ops-wallet.json

# Fund with 0.1 SOL
solana transfer ops-wallet.json 0.1

# Save public key
OPS_WALLET=$(solana-keygen pubkey ops-wallet.json)
echo "Operations wallet: $OPS_WALLET"

# Create token account for operations wallet
spl-token create-account <MINT_ADDRESS> --owner $OPS_WALLET
```

---

### Step 4: Create Burn PDA Token Account

The burn address is a PDA owned by the fee sweep program:

```bash
# Derive burn PDA (seeds = ["burn"])
# This will be done by the fee sweep program during initialization
```

---

### Step 5: Mint Initial Supply

```bash
# Mint 1,073,741,824 tokens (2^30 with 9 decimals)
spl-token mint <MINT_ADDRESS> 1073741824000000000

# Check balance
spl-token balance <MINT_ADDRESS>
```

---

### Step 6: Test Transfer with Fee

```bash
# Create a test recipient wallet
solana-keygen new --no-passphrase -o recipient.json
RECIPIENT=$(solana-keygen pubkey recipient.json)

# Create token account for recipient
spl-token create-account <MINT_ADDRESS> --owner $RECIPIENT

# Transfer 100 tokens
spl-token transfer <MINT_ADDRESS> 100 $RECIPIENT --fund-recipient

# Check balances
echo "Recipient balance:"
spl-token balance <MINT_ADDRESS> --owner $RECIPIENT
# Expected: 98 tokens (2% withheld as fee)
```

---

### Step 7: Sweep Withheld Fees

```bash
# Harvest withheld fees from token accounts
spl-token withdraw-withheld-tokens <MINT_ADDRESS> <DESTINATION_TOKEN_ACCOUNT>

# The fee sweep program then distributes:
# - 50% to burn PDA
# - 50% to ops wallet
```

---

## 🚨 TROUBLESHOOTING

### Common Issues

1. **"Transfer Fee not enabled"**
   - Ensure mint was created with `--enable-transfer-fee`

2. **"Fee already withdrawn"**
   - Fees can only be harvested once per account

3. **"Insufficient SOL for rent"**
   - Each token account needs ~0.002 SOL rent

---

## 🔍 VERIFICATION

### Check Mint Configuration
```bash
spl-token display <MINT_ADDRESS>
# Should show: Transfer Fee: 200 basis points (2%)
```

### Check Withheld Fees
```bash
spl-token accounts --owner <WALLET> -v
# Shows withheld amount per account
```

---

## 🎯 NEXT STEPS

### Phase 1: Testing Complete
- [ ] Verify fee is withheld (2%)
- [ ] Test fee sweep mechanism
- [ ] Confirm 50/50 distribution

### Phase 2: Mainnet
- [ ] Deploy with freeze authority
- [ ] Set up LP lock
- [ ] External audit

---

**Status**: 🟢 READY FOR EXECUTION  
**Timeline**: 30-60 minutes  
**Architecture**: Native Transfer Fee Extension

*Updated: 2026-02-08 (Aligned with ADR_TRANSFER_FEE.md)*