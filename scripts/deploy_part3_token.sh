#!/bin/bash
# DEPLOY PART 3: TOKEN ASSET GENESIS
# ----------------------------------
# Mints the $GRID Token-2022 and activates the Transfer Hook.

echo "🚀 STARTING V3.1 DEPLOYMENT - PART 3: TOKEN GENESIS"

# Configuration
SYSTEMS_DIR="../../grid-core/systems"
MINT_KEYPAIR_PATH="./target/deploy/grid_token-keypair.json"
HOOK_KEYPAIR_PATH="./target/deploy/grid_transfer_hook-keypair.json"

# Check dependencies
if ! command -v spl-token &> /dev/null; then
    echo "❌ 'spl-token' is not installed. Please install it (cargo install spl-token-cli)."
    exit 1
fi

# 1. Generate Mint Keypair (if missing)
mkdir -p target/deploy
if [ ! -f "$MINT_KEYPAIR_PATH" ]; then
    echo "[1/5] Generating new Mint Keypair..."
    solana-keygen new -o "$MINT_KEYPAIR_PATH" --no-bip39-passphrase --silent
fi
MINT_ADDR=$(solana address -k "$MINT_KEYPAIR_PATH")
echo "🔑 Mint Address: $MINT_ADDR"

# 2. Get Hook ID
if [ ! -f "$HOOK_KEYPAIR_PATH" ]; then
    echo "❌ Hook Keypair not found. Did you run Part 2?"
    read -p "Enter Transfer Hook Program ID manually: " HOOK_PID
else
    HOOK_PID=$(solana address -k "$HOOK_KEYPAIR_PATH")
fi
echo "🪝 Transfer Hook: $HOOK_PID"

# 3. Create Token
echo "[2/5] Creating Token-2022..."
# Note: Transfer Fee config is optional for Devnet but good for testing.
# We enable Transfer Hook.
spl-token create-token \
  --program-id TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb \
  --enable-transfer-hook \
  --transfer-hook-program-id $HOOK_PID \
  --enable-metadata \
  "$MINT_KEYPAIR_PATH"

# 4. Initialize Metadata
echo "[3/5] Initializing Metadata..."
METADATA_URI="https://grid.sovereignswarm.io/metadata.json"
spl-token initialize-metadata "$MINT_KEYPAIR_PATH" "The Grid" "GRID" "$METADATA_URI"

# 5. Initialize Hook (ExtraAccountMetas)
echo "[4/5] Initializing Transfer Hook Logic..."
pushd "$SYSTEMS_DIR/token" > /dev/null
# Ensure deps
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
fi
# Run Script
# We use the payer from solana config
PAYER_KEYPAIR=$(solana config get | grep "Keypair Path" | awk '{print $3}')
npx ts-node scripts/init_hook.ts --mint "$MINT_ADDR" --hook-pid "$HOOK_PID" --payer "$PAYER_KEYPAIR"
popd > /dev/null

# 6. Mint Supply
echo "[5/5] Minting Supply..."
spl-token mint "$MINT_ADDR" 100000000

echo ""
echo "=================================================="
echo "🎉 TOKEN GENERATION COMPLETE"
echo "=================================================="
echo "Mint: $MINT_ADDR"
echo ""
echo "NEXT STEPS:"
echo "1. Update 'grid-interface/src/lib/chain-config.js' with this Mint Address."
echo "2. Start the Frontend!"
