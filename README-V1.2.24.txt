SeaCat Backtest V1.2.24

更新：
- 修正版本号递增为 1.2.24
- 修正复盘图表不明显滚动的问题，改为固定窗口推进
- 新增模拟交易区
- 支持设置初始资金
- 支持设置下单数量
- 支持 开多 / 开空 / 平仓
- 支持 浮盈亏 / 已实现盈亏 / 账户净值 显示

运行：
chmod +x run-dev.sh
./run-dev.sh

Git：
git add .
git commit -m "feat: v1.2.24 add paper trading and fix replay chart"
git push
