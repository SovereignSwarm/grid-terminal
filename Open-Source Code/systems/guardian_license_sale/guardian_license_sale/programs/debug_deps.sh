#!/bin/bash
export PATH="/home/jorqu/.cargo/bin:/home/jorqu/.avm/bin:/home/jorqu/.local/share/solana/install/active_release/bin:$PATH"

cd guardian_license_sale
echo "Downgrading wit-bindgen to avoid edition2024..."
cargo update -p wit-bindgen --precise 0.49.0
echo "Downgrade wit-bindgen result: $?"
cd ..
