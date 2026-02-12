#!/bin/bash
set +e

echo "Starting DEBUG BUILD..."

# 1. Regenerate Lockfile
rm -f Cargo.lock
cargo generate-lockfile

# 2. Targeted Downgrades
echo "Downgrading tempfile (Vector 1)..."
cargo update -p tempfile:3.25.0 --precise 3.10.1 || echo "tempfile skip"
cargo update -p jobserver:0.1.34 --precise 0.1.31 || echo "jobserver skip"
cargo update -p getrandom:0.3.4 --precise 0.2.17 || echo "getrandom skip"

# 3. Standard Pins
echo "Applying Standard Pins..."
cargo update -p indexmap:2.2.6 --precise 2.2.6
cargo update -p zerocopy:0.7.35 --precise 0.7.34

echo "READY TO BUILD"
export RUST_BACKTRACE=1
cargo build-sbf > build_output.log 2>&1
echo "BUILD COMPLETE (Exit Code: $?)"
