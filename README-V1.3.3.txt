SeaCat Backtest v1.3.3

- Higher intervals (30m/1h/4h/1d/1W) now resolve from loaded lower intervals locally before calling Binance.
- Empty or tiny cached datasets are ignored to avoid one-bar/blank-chart failures.
- Main chart falls back to master interval window when observation interval data is unusable.
- Crosshair-linked preview windows remain enabled.
