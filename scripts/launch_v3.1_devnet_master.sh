#!/bin/bash
# LAUNCH V3.1 DEVNET MASTER SCRIPT
# --------------------------------
# The "One-Click" launcher for the Sovereign Swarm Grid Protocol V3.1.
# Orchestrates Infrastructure, Governance, and Asset Issuance.

set -e # Exit on error

# Configuration
SYSTEMS_DIR="../Source Code/systems"
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
STAKING_FILE="$SYSTEMS_DIR/governance/programs/vegrid-staking/src/lib.rs"
MINT_KEYPAIR_PATH="./target/deploy/grid_token-keypair.json"

echo "=================================================="
echo "🦅 SOVEREIGN SWARM: V3.1 DEVNET LAUNCH SEQUENCE 🦅"
echo "=================================================="
echo ""

# 0. PRE-FLIGHT CHECK
echo "[0/5] Pre-Flight Safety Checks..."

# Check for Placeholder Keys (The "Zero-Sim" Compliance)
if grep -q "Dao1111111111111111111111111111111111111111" "$STAKING_FILE"; then
    echo "❌ CRITICAL ERROR: Placeholder 'Dao111...' found in vegrid-staking!"
    echo "   You must replace this with your actual Wallet/DAO address to enable Slashing."
    echo "   See: DEVNET_CONFIG_INSTRUCTIONS.md"
    exit 1
fi
echo "✅ Configuration Verified (No Placeholders detected)."

# 1. BUILD REPAIR
echo "[1/5] Ensuring Build Integrity..."
./fix_build.sh
if [ $? -ne 0 ]; then
    echo "❌ Build Repair Failed."
    exit 1
fi

# 2. PHASE 1: INFRASTRUCTURE
echo ""
echo "[2/5] Deploying Phase 1: Identity & Staking..."
./deploy_part1_infrastructure.sh

# 3. INTERMISSION (Manual Action)
echo ""
echo "=================================================="
echo "⏸️  PAUSED FOR MANUAL CONFIGURATION"
echo "=================================================="
echo "You must now copy the NEW Program IDs (printed above) into the source code."
echo ""
echo "1. Copy IDENTITY_PID -> 'systems/token/programs/grid-transfer-hook/src/lib.rs'"
echo "2. Copy STAKING_PID  -> 'systems/governance/programs/vegrid-staking/src/lib.rs' (if needed)"
echo "3. Update 'Anchor.toml' with new PIDs."
echo ""
read -p "Type 'YES' when you have updated the files and are ready to continue: " CONFIRM
if [ "$CONFIRM" != "YES" ]; then
    echo "❌ Aborted."
    exit 1
fi

# 4. PHASE 2: GOVERNANCE & TOKEN
echo ""
echo "[3/5] Deploying Phase 2: Guard, Hook, Sweep..."
./deploy_part2_governance.sh

echo ""
echo "=================================================="
echo "✅ CONTRACTS DEPLOYED SUCCESSFULLY"
echo "=================================================="

# 5. ASSET GENERATION
echo ""
echo "[4/5] Preparing to Mint $GRID Token..."
read -p "Do you want to run the automated Mint Sequence now? (y/n) " MINT_C
if [[ "$MINT_C" == "y" || "$MINT_C" == "Y" ]]; then
    
    # Check if mint keypair exists, generate if not
    mkdir -p target/deploy
    if [ ! -f "$MINT_KEYPAIR_PATH" ]; then
        echo "Generating new Mint Keypair..."
        solana-keygen new -o "$MINT_KEYPAIR_PATH" --no-bip39-passphrase --silent
    fi
    MINT_ADDR=$(solana address -k "$MINT_KEYPAIR_PATH")
    
    # Extract Hook PID (Naive grep or just ask user? Let's use the keypair file if it exists)
    HOOK_PID=$(solana address -k target/deploy/grid_transfer_hook-keypair.json)
    
    echo "Mint Address: $MINT_ADDR"
    echo "Hook Address: $HOOK_PID"
    
    # Run Mint Command
    echo "Executing 'spl-token create-token'..."
    spl-token create-token \
      --program-id TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb \
      --enable-transfer-hook \
      --transfer-hook-program-id $HOOK_PID \
      --enable-transfer-fee 200 1000000000 \
      --enable-metadata \
      "$MINT_KEYPAIR_PATH"
      
    echo "Initializing Metadata..."
    METADATA_URI="https://grid.sovereignswarm.io/metadata.json"
    spl-token initialize-metadata "$MINT_KEYPAIR_PATH" "The Grid" "GRID" "$METADATA_URI"
    
    echo "Initializing Transfer Hook..."
    # Call the TS script we made
    pushd "$SYSTEMS_DIR/token" > /dev/null
    npx ts-node scripts/init_hook.ts --mint "$MINT_ADDR" --guard "$GUARD_PID" --payer "~/.config/solana/id.json"
    popd > /dev/null
    
    echo "Minting Supply..."
    spl-token mint "$MINT_ADDR" 1073741824
    
    echo ""
    echo "🎉 LAUNCH COMPLETE! $GRID is live on Devnet."
    echo "Address: $MINT_ADDR"
else
    echo "Skipping Mint. You can do this manually using MINT_INSTRUCTIONS.md"
fi
