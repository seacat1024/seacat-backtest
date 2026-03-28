SeaCat Backtest V1.2.37

修复：
- 修正子图关闭后下方仍然闪动的问题
- IndicatorSubcharts 在 showRsi 和 showMacd 都为 false 时直接 return null
- 版本号统一为合法 semver：1.2.37

本次改动文件：
- src/pages/Training.tsx
  - 大约 300 行附近：IndicatorSubcharts 增加 if (!showRsi && !showMacd) return null
- package.json
- src-tauri/Cargo.toml
- src-tauri/tauri.conf.json

说明：
- 这包重点修复编译与子图闪动
- Dock 白底图标问题本包未彻底解决，需要后续替换透明 icon.icns
