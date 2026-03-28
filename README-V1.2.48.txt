SeaCat Backtest V1.2.48

这次是基于你上传的 Git 压缩包直接改的。

修复/升级：
- 去掉随机复盘只在最近 5000 根里随机的问题
- 新增 fetchAllKlines：循环向前拉取 Binance 合约历史，目标为 5 年
- 新增 full kline cache：本地缓存完整历史
- 启动后优先读取完整历史缓存，不再依赖假数据
- 数据加载失败时不再回退到 generateMockBars 假数据
- 随机起点改成从完整历史 bars.length 中随机

关键改动文件：
- src/pages/Training.tsx
  - 新增 loadFullKlines / saveFullKlines
  - fetchFuturesKlines -> fetchAllKlines
  - 删除 catch 中的 generateMockBars 回退
  - restartReplay / bars 初始化随机逻辑改为从完整历史随机
- package.json / src-tauri/Cargo.toml / src-tauri/tauri.conf.json
  - 版本号统一为 1.2.48
