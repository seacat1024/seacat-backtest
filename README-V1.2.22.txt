SeaCat Backtest V1.2.22

更新：
- 新增 Binance K 线本地缓存
- 按 交易对 + 周期 分别缓存
- 先读本地缓存，再后台刷新远端数据
- 远端失败时优先显示缓存；没有缓存才回退到本地模拟数据
- 顶部新增缓存状态标签

运行：
chmod +x run-dev.sh
./run-dev.sh

Git：
git add .
git commit -m "feat: v1.2.22 add local kline cache by symbol and interval"
git push
