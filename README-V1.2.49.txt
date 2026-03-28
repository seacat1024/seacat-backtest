SeaCat Backtest V1.2.49

这次是基于你上传的 Git 压缩包直接改的。

新增：
- 历史拉取进度显示
  - 第几批
  - 当前累计多少根
  - 当前已经拉到的时间范围（最老 -> 最新）
- 拉过后会缓存完整历史
- 下次优先读完整历史缓存，不再重复从头拉
- 保留最近缓存与完整缓存双层逻辑

关键改动文件：
- src/pages/Training.tsx
  - 新增 KlineFetchProgress
  - fetchAllKlines 支持 onProgress 回调
  - 新增 fetchProgress 状态与 fetchStatusText
  - UI 增加 fetch-progress-banner
- src/styles/global.css
  - 新增 .fetch-progress-banner
- package.json / src-tauri/Cargo.toml / src-tauri/tauri.conf.json
  - 版本号统一为 1.2.49
