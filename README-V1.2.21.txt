SeaCat Backtest V1.2.21

Updates:
- fetches real Binance Futures klines
- replaces mock chart data with live BTCUSDT / ETHUSDT futures candles
- interval buttons now refetch real data
- keeps local indicator profiles per symbol
- adds loading state
- if Binance fetch fails, falls back to local mock data and shows an error banner

Run:
chmod +x run-dev.sh
./run-dev.sh

Git:
git add .
git commit -m "feat: v1.2.21 add binance futures kline fetch"
git push
