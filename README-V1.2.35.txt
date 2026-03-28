SeaCat Backtest V1.2.35

更新：
- 新增最大回撤
- 新增当前回撤
- 新增最大连胜
- 新增最大连亏
- 交易统计面板扩展为 9 项

本次改动文件：
- src/pages/Training.tsx
  - 大约 300-340 行：新增回撤与连胜/连亏统计逻辑
  - 大约 560 行附近：统计面板扩展
- src/styles/global.css
  - stats-panel 改成 grid 布局，适配更多统计卡片
- package.json / src-tauri/Cargo.toml / src-tauri/tauri.conf.json
  - 版本号升到 1.2.35

运行：
chmod +x run-dev.sh
./run-dev.sh
