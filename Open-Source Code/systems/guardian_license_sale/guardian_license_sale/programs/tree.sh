#!/bin/bash
export PATH="/home/jorqu/.cargo/bin:/home/jorqu/.avm/bin:/home/jorqu/.local/share/solana/install/active_release/bin:$PATH"

cd guardian_license_sale
cargo tree -i constant_time_eq
