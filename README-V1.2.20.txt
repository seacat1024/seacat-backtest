SeaCat Backtest V1.2.20

Updates:
- indicator settings now persist with localStorage
- each trading pair keeps its own indicator profile
- switching BTCUSDT / ETHUSDT loads separate saved settings
- added reset button for current symbol profile
- MACD / RSI / MA / EMA settings all persist locally

Run:
chmod +x run-dev.sh
./run-dev.sh

Git:
git add .
git commit -m "feat: v1.2.20 persist indicator profiles per symbol"
git push
