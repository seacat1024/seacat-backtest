SeaCat Backtest V1.2.39

修复：
- 彻底修复关闭 RSI / MACD 后下方仍然闪动的问题
- IndicatorSubcharts 内部增加 if (!showRsi && !showMacd) return null
- KlineChart 父层只有在启用 RSI 或 MACD 时才挂载 IndicatorSubcharts
- 版本号统一为 1.2.39

本次改动文件：
- src/pages/Training.tsx
  - 大约 300 行附近：IndicatorSubcharts 增加 early return
  - 大约 520 行附近：KlineChart 中按条件挂载 IndicatorSubcharts
- src/styles/global.css
  - 末尾追加 .subcharts:empty 兜底样式
- package.json / src-tauri/Cargo.toml / src-tauri/tauri.conf.json
  - 版本号升到 1.2.39

说明：
- 这版重点修“播放时子图区闪动”
- 白底图标问题仍未在本包内彻底处理
