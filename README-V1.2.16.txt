SeaCat Backtest V1.2.16

更新：
- 修复 Dock 图标（多尺寸 PNG + icns）
- run-dev.sh 内置 cargo clean，避免 macOS 图标缓存
- K 线主图加入十字线
- 鼠标移动显示 OHLC + MA/EMA 当前数值
- 保留双列参数卡片布局

运行：
chmod +x run-dev.sh
./run-dev.sh

提交：
git add .
git commit -m "feat: v1.2.16 add dock icon and crosshair hover panel"
git push
