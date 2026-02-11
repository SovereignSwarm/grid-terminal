#!/bin/bash
set +e

echo "Starting FINAL RESCUE (Grand Slam + Blake3 + AsyncTrait)..."

# 1. Regenerate Lockfile
rm -f Cargo.lock
cargo generate-lockfile

# 2. Targeted Downgrades (The Chain of Edition 2024)

# Chain A: wit-bindgen 0.51 -> wasip2 -> getrandom 0.3 -> tempfile 3.25
echo "Downgrading tempfile (Chain A)..."
cargo update -p tempfile:3.25.0 --precise 3.10.1 || echo "tempfile skip"
cargo update -p jobserver:0.1.34 --precise 0.1.31 || echo "jobserver skip"
cargo update -p getrandom:0.3.4 --precise 0.2.17 || echo "getrandom skip"

# Chain B: constant_time_eq 0.4 -> blake3 1.8.3
echo "Downgrading blake3 (Chain B)..."
# blake3 1.5.0 uses constant_time_eq 0.3 (Safe)
cargo update -p blake3:1.8.3 --precise 1.5.0 || echo "blake3 skip"

# Chain C: async-trait 0.1.89 (Edition 2024) -> solana-client/tpu-client
echo "Downgrading async-trait (Chain C)..."
cargo update -p async-trait:0.1.89 --precise 0.1.80 || echo "async-trait skip"

# 3. Standard Pins
echo "Applying Standard Pins..."
cargo update -p indexmap:2.2.6 --precise 2.2.6
cargo update -p zerocopy:0.7.35 --precise 0.7.34

echo "Building..."
export RUST_BACKTRACE=1
cargo build-sbf
