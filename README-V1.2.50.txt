SeaCat Backtest V1.2.50

这次是基于你上传的 Git 压缩包重新完整打的包。

修复/升级：
- 真正接入 5 年历史拉取函数 fetchAllKlines(symbol, interval, onProgress)
- 新增完整历史缓存 loadFullKlines/saveFullKlines
- 新增历史拉取进度显示：
  - 第几批
  - 当前累计多少根
  - 当前已拉到的时间范围
- 随机起点从完整历史中随机，不再只从 5000 根里随机
- 删除假数据回退路径
- 修正指标中心保存逻辑，避免父组件状态回写循环

关键改动文件：
- src/pages/Training.tsx
- src/components/indicators/IndicatorCenterModal.tsx
- src/styles/global.css
- package.json / src-tauri/Cargo.toml / src-tauri/tauri.conf.json
