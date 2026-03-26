SeaCat Backtest V1.2.25

修正：
- 版本号改为 v1.2.25
- 修正复盘时图表不明显滚动的问题，改成固定窗口推进
- 修正模拟交易区未显示的问题
- 新增 初始资金 / 下单数量 / 开多 / 开空 / 平仓
- 新增 余额 / 浮盈亏 / 已实现盈亏 / 净值 / 持仓信息

运行：
chmod +x run-dev.sh
./run-dev.sh

Git：
git add .
git commit -m "fix: v1.2.25 replay window and paper trading panel"
git push
