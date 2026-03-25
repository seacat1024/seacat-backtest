#!/usr/bin/env bash
set -e

if ! command -v npm >/dev/null 2>&1; then
  echo "未找到 npm，请先安装 Node.js"
  exit 1
fi

if ! command -v cargo >/dev/null 2>&1; then
  echo "未找到 cargo，请先安装 Rust"
  exit 1
fi

npm install
cargo tauri dev
