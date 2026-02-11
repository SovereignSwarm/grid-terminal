#!/bin/bash
set -e

# Setup Clean Environment
export CARGO_HOME=/tmp/cargo_clean_home
mkdir -p $CARGO_HOME

echo "Testing minimal solana-program fetch..."
# Step 1: Just solana-program (if this fails, the issue is CORE)
printf '[package]\nname="test"\nversion="0.1.0"\nedition="2021"\n[dependencies]\nsolana-program="1.18.11"\n' > Cargo.toml
cargo fetch || echo "FAIL: solana-program"

echo "Testing anchor-lang fetch (if needed)..."
# printf ...
