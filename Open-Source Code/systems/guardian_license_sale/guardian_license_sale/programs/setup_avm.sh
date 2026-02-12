#!/bin/bash
export PATH="/home/jorqu/.avm/bin:/home/jorqu/.cargo/bin:/home/jorqu/.local/share/solana/install/active_release/bin:$PATH"

echo "Attempting to install and use Anchor 0.29.0..."
yes | avm install 0.29.0
avm use 0.29.0

anchor --version
