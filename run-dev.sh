#!/usr/bin/env bash
set -e
npm install
cargo clean
cargo tauri dev
