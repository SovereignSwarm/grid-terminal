#!/bin/bash
export PATH="/home/jorqu/.cargo/bin:$PATH"

echo "Setting stable as default..."
rustup default stable

echo "Current rustc version:"
rustc --version
