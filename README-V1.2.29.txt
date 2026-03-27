SeaCat Backtest V1.2.29

更新：
- 新增持仓高亮区块
- 新增开仓到平仓连线中的盈亏标签
- 优化开多 / 开空 / 平仓箭头与文字间距
- 升级专业交易UI
- 版本号升级为 v1.2.29

重点改动文件：
- src/pages/Training.tsx
  - 大约 417-489 行：KlineChart 图上持仓高亮、盈亏标签、箭头上移
  - 大约 771-792 行：专业交易UI、账户卡片、指标栏下的交易面板
- src/styles/global.css
  - 文件末尾追加 trade-ui-panel / metric-card / up / down 等样式

运行：
chmod +x run-dev.sh
./run-dev.sh
