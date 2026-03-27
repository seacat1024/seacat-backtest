SeaCat Backtest V1.2.33

更新：
- 新增止盈 / 止损输入框
- 新增手续费率输入框
- 播放过程中自动触发 TP / SL 平仓
- 平仓盈亏改为扣除手续费后的净盈亏
- 交易记录新增平仓原因与手续费

本次改动文件：
- src/pages/Training.tsx
  - 大约 15-35 行：PositionState / TradeRecord 增加 TP / SL / fee / reason 字段
  - 大约 265-272 行：新增 takeProfitInput / stopLossInput / feeRate 状态
  - 大约 315-360 行：新增 settlePosition，开仓 / 平仓逻辑升级
  - 大约 360-380 行：新增自动触发 TP / SL 的 useEffect
  - 大约 415-440 行：专业交易 UI 增加 止盈 / 止损 / 手续费% 输入框
  - 大约 475 行：净值 / 持仓卡片显示 TP / SL
  - 大约 520 行：交易记录显示平仓原因与手续费
- src/styles/global.css
  - 末尾追加 trade-grid-3 样式
- package.json / src-tauri/Cargo.toml / src-tauri/tauri.conf.json
  - 版本号升到 1.2.33

运行：
chmod +x run-dev.sh
./run-dev.sh
