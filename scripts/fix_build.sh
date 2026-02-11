#!/bin/bash
# FIX BUILD SCRIPT (The "Nuclear Option")
# ---------------------------------------
# Automatically repairs the "Edition 2024" dependency conflict in Solana programs.
# See: POSTMORTEM_SOLANA_BUILD_FIX.md

# Path to "Source Code/systems" relative to this script
SYSTEMS_DIR="../Source Code/systems"

apply_pins() {
    local target_dir=$1
    echo "🔧 Repairing workspace: $target_dir"
    
    if [ -d "$target_dir" ]; then
        pushd "$target_dir" > /dev/null
        
        # 1. Reset Lockfile (Nuclear)
        rm -f Cargo.lock
        
        # 2. Apply Surgical Pins to break dependency chains to 'wit-bindgen' 0.51+
        echo "   -> Pinning 'tempfile' to 3.9.0..."
        cargo update -p tempfile@3.25.0 --precise 3.9.0 2>/dev/null || echo "      (tempfile skipped)"
        
        echo "   -> Pinning 'ahash' to 0.8.11..."
        cargo update -p ahash@0.8.12 --precise 0.8.11 2>/dev/null || echo "      (ahash skipped)"
        
        echo "   -> Pinning 'jobserver' to 0.1.31..."
        cargo update -p jobserver --precise 0.1.31 2>/dev/null || echo "      (jobserver skipped)"
        
        echo "   -> Pinning 'indexmap' to 2.2.6..."
        cargo update -p indexmap@2.13.0 --precise 2.2.6 2>/dev/null || echo "      (indexmap skipped)"
        
        popd > /dev/null
        echo "✅ Repair complete for $target_dir"
    else
        echo "⚠️  Directory not found: $target_dir"
    fi
}

echo "🛡️  STARTING BUILD REPAIR PROTOCOL..."

# Iterate through the 3 main workspaces
apply_pins "$SYSTEMS_DIR/token/programs"
apply_pins "$SYSTEMS_DIR/governance/programs"
apply_pins "$SYSTEMS_DIR/identity/programs"

echo "🏁 All workspaces processed. You can now run 'anchor build'."
