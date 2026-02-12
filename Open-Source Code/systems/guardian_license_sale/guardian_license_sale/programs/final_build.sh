#!/bin/bash
export PATH="/home/jorqu/.cargo/bin:/home/jorqu/.avm/bin:/home/jorqu/.local/share/solana/install/active_release/bin:$PATH"

echo "Current rustc:"
rustc --version

echo "Building..."
anchor build
