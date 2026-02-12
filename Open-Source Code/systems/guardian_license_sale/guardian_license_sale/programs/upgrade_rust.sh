#!/bin/bash
export PATH="/home/jorqu/.cargo/bin:$PATH"

echo "Checking current rust version..."
rustc --version

echo "Updating rustup..."
rustup update stable

echo "Updating solana toolchain..."
# Sometimes solana-shf version needs to be synced
# but let's see if rust upgrade is enough first.

echo "New rust version:"
rustc --version
