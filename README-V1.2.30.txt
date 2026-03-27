SeaCat Backtest V1.2.30

更新：
- 开多 / 开空 / 平仓箭头整体上移，避免压住K线与影线
- Binance 历史K线请求从 500 提升到 5000
- 版本号升级为 v1.2.30

本次改动文件：
- src/pages/Training.tsx
  - 151 行附近：fetchFuturesKlines 默认 limit 从 500 改为 5000
  - 601 行附近：fetchFuturesKlines 调用数量从 500 改为 5000
  - 486-505 行附近：开多 / 开空 / 平仓箭头与文字上移
- package.json
- src-tauri/Cargo.toml
- src-tauri/tauri.conf.json

运行：
chmod +x run-dev.sh
./run-dev.sh
