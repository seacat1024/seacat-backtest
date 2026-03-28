SeaCat Backtest V1.2.47

这次是基于你上传的 Git 压缩包直接修的。

真正修复：
- 去掉 Training.tsx 里 centerState <-> profiles 的双向反馈循环
- 指标保存不再在 useEffect 里自动反复回写
- 改成点击“应用”时，才一次性写入 centerState 和 profiles
- 这样 RSI / MACD 的勾选与取消不会再被父组件立刻覆盖

关键改动文件：
- src/pages/Training.tsx
  - 原来：
    - useEffect([symbol, profiles]) -> setCenterState(...)
    - useEffect([symbol, centerState]) -> setProfiles(...)
  - 现在：
    - 只在 symbol 切换时加载 centerState
    - 新增 handleIndicatorSave(next)
- src/components/indicators/IndicatorCenterModal.tsx
  - 增加 useEffect([open, value]) 同步 draft
- package.json / src-tauri/Cargo.toml / src-tauri/tauri.conf.json
  - 版本号统一为 1.2.47
