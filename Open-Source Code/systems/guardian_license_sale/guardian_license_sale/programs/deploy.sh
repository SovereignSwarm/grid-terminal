#!/bin/bash
# Add Anchor and Solana to PATH
export PATH="/home/jorqu/.cargo/bin:/home/jorqu/.avm/bin:/home/jorqu/.local/share/solana/install/active_release/bin:$PATH"

# Deploy
anchor deploy --provider.cluster devnet --program-name guardian_license_sale
