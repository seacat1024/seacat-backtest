SeaCat Backtest V1.2.18

Updates:
- Added visible scale labels to RSI: 70 / 50 / 30
- Added visible scale labels to MACD: top / 0 / bottom
- Added vertical padding so MACD bars/lines no longer get hidden by the bottom edge
- Subchart headers now show live hovered RSI / MACD values

Run:
chmod +x run-dev.sh
./run-dev.sh

Git:
git add .
git commit -m "fix: v1.2.18 add RSI/MACD scales and MACD bottom padding"
git push
