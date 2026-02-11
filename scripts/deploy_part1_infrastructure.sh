#!/bin/bash
# DEPLOY PART 1: INFRASTRUCTURE (Identity & Staking)
# --------------------------------------------------
# This script deploys the base dependencies that other programs rely on.

echo "🚀 STARTING V3.1 DEPLOYMENT - PART 1: INFRASTRUCURE"

# 1. Build Verification
echo "[1/3] Building contracts..."
anchor build
if [ $? -ne 0 ]; then
    echo "❌ Build failed. Please fix errors before deploying."
    exit 1
fi

# 2. Deploy Agent Identity
echo "[2/3] Deploying Agent Identity..."
# Uses the keypair defined in Anchor.toml
solana program deploy ./target/deploy/agent_identity.so
IDENTITY_PID=$(solana address -k target/deploy/agent_identity-keypair.json)
echo "✅ Agent Identity Deployed: $IDENTITY_PID"

# 3. Deploy veGRID Staking
echo "[3/3] Deploying veGRID Staking..."
solana program deploy ./target/deploy/vegrid_staking.so
STAKING_PID=$(solana address -k target/deploy/vegrid_staking-keypair.json)
echo "✅ veGRID Staking Deployed: $STAKING_PID"

echo ""
echo "=================================================="
echo "🛑 STOP & ACTION REQUIRED"
echo "=================================================="
echo "You must now update the source code with these new Program IDs:"
echo ""
echo "1. Update 'grid-transfer-hook/src/lib.rs':"
echo "   Replace AGENT_IDENTITY_PID with: $IDENTITY_PID"
echo ""
echo "2. Update 'policy-guard/src/lib.rs' (Initialization Config):"
echo "   (This is done via client args, but good to note)"
echo ""
echo "3. Update 'Anchor.toml':"
echo "   agent_identity = \"$IDENTITY_PID\""
echo "   vegrid_staking = \"$STAKING_PID\""
echo ""
echo "Once updated, run 'deploy_part2_governance.sh'"
