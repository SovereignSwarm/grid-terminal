#!/bin/bash
echo "Searching for Edition 2024 in ~/.cargo/registry/src..."
cd /home/jorqu/.cargo/registry/src
find . -name "Cargo.toml" -exec grep -l 'edition = "2024"' {} +
