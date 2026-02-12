#!/bin/bash
# Deploy $GRID Transfer Hook to Solana Devnet

set -e

echo "🦅 GRID TRANSFER HOOK DEPLOYMENT SCRIPT"
echo "========================================"
echo ""

# Check Anchor is installed
if ! command -v anchor &> /dev/null
then
    echo "❌ Anchor CLI not found. Install with:"
    echo "   cargo install --git https://github.com/coral-xyz/anchor avm --locked --force"
    echo "   avm install 0.30.1"
    echo "   avm use 0.30.1"
    exit 1
fi

# Check Solana is installed
if ! command -v solana &> /dev/null
then
    echo "❌ Solana CLI not found. Install with:"
    echo "   sh -c \"\$(curl -sSfL https://release.solana.com/stable/install)\""
    exit 1
fi

# Set cluster to devnet
echo "📡 Setting cluster to devnet..."
solana config set --url https://api.devnet.solana.com

# Check wallet balance
BALANCE=$(solana balance | awk '{print $1}')
echo "💰 Wallet balance: $BALANCE SOL"

if (( $(echo "$BALANCE < 0.5" | bc -l) )); then
    echo "⚠️  Low balance. Requesting airdrop..."
    solana airdrop 2
    sleep 5
fi

# Build program
echo ""
echo "🔨 Building program..."
cd "$(dirname "$0")"
anchor build

# Get program ID
PROGRAM_ID=$(solana address -k target/deploy/grid_transfer_hook-keypair.json)
echo ""
echo "📋 Program ID: $PROGRAM_ID"

# Update Anchor.toml and lib.rs with actual program ID
echo ""
echo "📝 Updating program ID in source files..."
sed -i "s/11111111111111111111111111111111/$PROGRAM_ID/g" Anchor.toml
sed -i "s/declare_id!(\"11111111111111111111111111111111\")/declare_id!(\"$PROGRAM_ID\")/g" grid-transfer-hook/src/lib.rs

# Rebuild with correct program ID
echo ""
echo "🔨 Rebuilding with correct program ID..."
anchor build

# Deploy
echo ""
echo "🚀 Deploying to devnet..."
anchor deploy --provider.cluster devnet

# Verify deployment
echo ""
echo "✅ Deployment complete!"
echo ""
echo "Program ID: $PROGRAM_ID"
echo "Cluster: Devnet"
echo "Explorer: https://explorer.solana.com/address/$PROGRAM_ID?cluster=devnet"
echo ""
echo "Next steps:"
echo "1. Create token mint with transfer hook extension"
echo "2. Initialize ExtraAccountMetaList"
echo "3. Test transfers"
echo ""
