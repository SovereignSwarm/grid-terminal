#!/bin/bash
# ============================================================================
# DEPLOY-POLICY-SYSTEM.SH
# Deploys the Policy Guard system to Devnet in the correct order.
# ============================================================================
# Usage: ./deploy-policy-system.sh [devnet|mainnet]
# ============================================================================

set -e

CLUSTER=${1:-devnet}
echo "🚀 Deploying Policy Guard System to $CLUSTER..."

# ----------------------------------------------------------------------------
# Step 1: Build Policy Guard
# ----------------------------------------------------------------------------
echo ""
echo "📦 Building policy-guard..."
cd ../governance/programs/policy-guard
anchor build

POLICY_GUARD_KEYPAIR=$(solana-keygen pubkey target/deploy/policy_guard-keypair.json 2>/dev/null || echo "NOT_FOUND")
echo "   Policy Guard Program ID: $POLICY_GUARD_KEYPAIR"

# ----------------------------------------------------------------------------
# Step 2: Deploy Policy Guard
# ----------------------------------------------------------------------------
echo ""
echo "☁️  Deploying policy-guard to $CLUSTER..."
anchor deploy --provider.cluster $CLUSTER

echo ""
echo "   ✅ Policy Guard deployed!"

# ----------------------------------------------------------------------------
# Step 3: Build Agent Identity (Optional - for full KYA)
# ----------------------------------------------------------------------------
echo ""
echo "📦 Building agent-identity..."
cd ../../identity/programs
anchor build

AGENT_IDENTITY_KEYPAIR=$(solana-keygen pubkey target/deploy/agent_identity-keypair.json 2>/dev/null || echo "NOT_FOUND")
echo "   Agent Identity Program ID: $AGENT_IDENTITY_KEYPAIR"

# ----------------------------------------------------------------------------
# Step 4: Deploy Agent Identity
# ----------------------------------------------------------------------------
echo ""
echo "☁️  Deploying agent-identity to $CLUSTER..."
anchor deploy --provider.cluster $CLUSTER

echo ""
echo "   ✅ Agent Identity deployed!"

# ----------------------------------------------------------------------------
# Step 5: Rebuild Transfer Hook with new Program IDs
# ----------------------------------------------------------------------------
echo ""
echo "📦 Rebuilding grid-transfer-hook with Policy Guard CPI..."
cd ../../token/programs
anchor build

# ----------------------------------------------------------------------------
# Summary
# ----------------------------------------------------------------------------
echo ""
echo "============================================================================"
echo "✅ DEPLOYMENT COMPLETE"
echo "============================================================================"
echo ""
echo "Policy Guard Program ID: $POLICY_GUARD_KEYPAIR"
echo "Agent Identity Program ID: $AGENT_IDENTITY_KEYPAIR"
echo ""
echo "Next Steps:"
echo "  1. Update DEPLOYED_CONTRACTS_REGISTRY.md with these IDs"
echo "  2. Update grid-interface/src/lib/chain-config.js"
echo "  3. Initialize the Guard: anchor run init-guard"
echo "============================================================================"
