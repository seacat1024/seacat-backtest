SeaCat Backtest V1.2.31

更新：
- 箭头改为以“该根K线最高价上方 30px”为锚点
- 平仓箭头也按该根K线最高价上方 30px 显示
- 历史K线改为分页拉取，目标最多 5000 根
- 顶部进度文字改为 “已加载 N 根”

本次改动文件：
- src/pages/Training.tsx
  - 大约 70-100 行：fetchFuturesKlines 改为分页拉取
  - 大约 470-500 行：开多 / 开空 / 平仓箭头改为按 K 线最高价 + 30px
  - 大约 740 行附近：进度文案改为“已加载 N 根”
- package.json
- src-tauri/Cargo.toml
- src-tauri/tauri.conf.json

运行：
chmod +x run-dev.sh
./run-dev.sh
