#!/bin/bash
# DEPLOY PART 2: GOVERNANCE (Guard & Hook)
# ----------------------------------------
# Prerequisite: You must have updated 'grid-transfer-hook' with the Identity PID from Part 1.

echo "🚀 STARTING V3.1 DEPLOYMENT - PART 2: GOVERNANCE"

# 1. Re-Build (to capture updated PIDs)
echo "[1/4] Re-building contracts with updated Constants..."
anchor build
if [ $? -ne 0 ]; then
    echo "❌ Build failed. Did you update the PIDs correctly?"
    exit 1
fi

# 2. Deploy Policy Guard
echo "[2/4] Deploying Policy Guard..."
solana program deploy ./target/deploy/policy_guard.so
GUARD_PID=$(solana address -k target/deploy/policy_guard-keypair.json)
echo "✅ Policy Guard Deployed: $GUARD_PID"

# 3. Deploy Transfer Hook
echo "[3/4] Deploying Grid Transfer Hook..."
solana program deploy ./target/deploy/grid_transfer_hook.so
HOOK_PID=$(solana address -k target/deploy/grid_transfer_hook-keypair.json)
echo "✅ Transfer Hook Deployed: $HOOK_PID"

# 4. Deploy Fee Sweep
echo "[4/4] Deploying Fee Sweep..."
solana program deploy ./target/deploy/grid_fee_sweep.so
SWEEP_PID=$(solana address -k target/deploy/grid_fee_sweep-keypair.json)
echo "✅ Fee Sweep Deployed: $SWEEP_PID"

echo ""
echo "=================================================="
echo "✅ CONTRACTS DEPLOYED"
echo "=================================================="
echo "Policy Guard:  $GUARD_PID"
echo "Transfer Hook: $HOOK_PID"
echo "Fee Sweep:     $SWEEP_PID"
echo ""
echo "Next Step: Initialize the Smart Contracts using the CLI or Scripts."
echo "Then allow 'deploy_part3_token.sh' to mint the asset."
