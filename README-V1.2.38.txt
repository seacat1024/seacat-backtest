SeaCat Backtest V1.2.38

修复：
- 彻底修复关闭 RSI / MACD 后播放时下方仍闪动的问题
- 父层不再挂载 IndicatorSubcharts
- IndicatorSubcharts 内部也增加双保险：两个指标都关闭时直接 return null
- 版本号统一为 1.2.38

本次改动文件：
- src/pages/Training.tsx
  - 大约 300 行附近：IndicatorSubcharts 增加 if (!showRsi && !showMacd) return null
  - 大约 520 行附近：KlineChart 里仅在启用 RSI 或 MACD 时才渲染 IndicatorSubcharts
- src/styles/global.css
  - 末尾追加 .subcharts:empty 样式，避免残余占位
- package.json / src-tauri/Cargo.toml / src-tauri/tauri.conf.json
  - 版本号升到 1.2.38

说明：
- 这版重点修“播放时子图区闪动”
- 白底图标问题仍需后续替换透明 icon.icns 才能彻底解决
