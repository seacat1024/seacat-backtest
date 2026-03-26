SeaCat Backtest V1.2.28

更新：
- 新增 开仓 → 平仓 连线
- 盈利连线为绿色，亏损连线为红色，未平仓为蓝色虚线
- 图上保留开多 / 开空 / 平仓箭头与文字
- 新增交易记录面板
- 保留模拟交易区、初始资金、下单数量、持仓信息
- 版本号升级为 v1.2.28

运行：
chmod +x run-dev.sh
./run-dev.sh

Git：
git add .
git commit -m "feat: v1.2.28 add trade link lines and records panel"
git push
