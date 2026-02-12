#!/bin/bash
export PATH="/home/jorqu/.avm/bin:/home/jorqu/.cargo/bin:/home/jorqu/.local/share/solana/install/active_release/bin:$PATH"

echo "Step 1: Cleanup conflicting binaries..."
rm -f /home/jorqu/.cargo/bin/anchor
rm -f /home/jorqu/.avm/bin/anchor

echo "Step 2: Install Anchor 0.29.0 via avm..."
# Use yes to handle any prompts
yes | avm install 0.29.0 --force

echo "Step 3: Switch to Anchor 0.29.0..."
avm use 0.29.0

echo "Step 4: Verify versions..."
anchor --version
solana --version

echo "Step 5: Build program..."
anchor build > build.log 2>&1
