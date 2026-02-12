#!/bin/bash
export PATH="/home/jorqu/.cargo/bin:/home/jorqu/.avm/bin:/home/jorqu/.local/share/solana/install/active_release/bin:$PATH"

cd guardian_license_sale
# Force downgrade of constant_time_eq to avoid edition2024 requirement
cargo update -p constant_time_eq --precise 0.3.0
cd ..

anchor build > build.log 2>&1
