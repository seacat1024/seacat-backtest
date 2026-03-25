import { useMemo, useState } from 'react'
import { createDefaultIndicator } from '../components/indicators/indicatorDefaults'
import type { IndicatorInstance, IndicatorType } from '../components/indicators/indicatorTypes'
import { formatIndicatorName } from '../components/indicators/indicatorUtils'

const indicatorTypes: IndicatorType[] = ['MA', 'EMA', 'MACD', 'RSI', 'KDJ']
const intervals = ['1m', '5m', '15m', '30m', '1h', '4h', '1d', '1W']
const symbols = ['BTCUSDT', 'ETHUSDT']

function generateMockBars(count = 120) {
  const out: { open: number; high: number; low: number; close: number }[] = []
  let price = 3200
  for (let i = 0; i < count; i++) {
    const drift = (Math.random() - 0.5) * 90
    const open = price
    const close = Math.max(100, open + drift)
    const high = Math.max(open, close) + Math.random() * 20
    const low = Math.min(open, close) - Math.random() * 20
    out.push({ open, high, low, close })
    price = close
  }
  return out
}

function KlineMockChart() {
  const bars = useMemo(() => generateMockBars(100), [])
  const width = 1100
  const height = 420
  const max = Math.max(...bars.map((b) => b.high))
  const min = Math.min(...bars.map((b) => b.low))
  const scaleY = (v: number) => {
    const pct = (v - min) / (max - min || 1)
    return height - 24 - pct * (height - 48)
  }

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="chart-svg">
      <rect x="0" y="0" width={width} height={height} fill="#0b0e11" />
      {Array.from({ length: 6 }).map((_, i) => {
        const y = 24 + i * ((height - 48) / 5)
        return <line key={i} x1="0" y1={y} x2={width} y2={y} stroke="#1f2937" strokeWidth="1" />
      })}
      {bars.map((b, i) => {
        const x = 20 + i * 10.5
        const openY = scaleY(b.open)
        const closeY = scaleY(b.close)
        const highY = scaleY(b.high)
        const lowY = scaleY(b.low)
        const up = b.close >= b.open
        const bodyY = Math.min(openY, closeY)
        const bodyH = Math.max(2, Math.abs(closeY - openY))
        return (
          <g key={i}>
            <line x1={x + 3} y1={highY} x2={x + 3} y2={lowY} stroke={up ? '#0ECB81' : '#F6465D'} strokeWidth="1.2" />
            <rect x={x} y={bodyY} width="6" height={bodyH} fill={up ? '#0ECB81' : '#F6465D'} rx="1" />
          </g>
        )
      })}
    </svg>
  )
}

export default function TrainingPage() {
  const [symbol, setSymbol] = useState('BTCUSDT')
  const [interval, setInterval] = useState('15m')
  const [instances, setInstances] = useState<IndicatorInstance[]>([])
  const [showPicker, setShowPicker] = useState(false)

  const addIndicator = (type: IndicatorType) => {
    const next = createDefaultIndicator(type)
    next.name = formatIndicatorName(next)
    setInstances((prev) => [...prev, next])
    setShowPicker(false)
  }

  const removeIndicator = (id: string) => {
    setInstances((prev) => prev.filter((item) => item.id !== id))
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand">SeaCat Backtest</div>
        <div className="symbol-group">
          {symbols.map((item) => (
            <button
              key={item}
              className={item === symbol ? 'btn active' : 'btn'}
              onClick={() => setSymbol(item)}
            >
              {item}
            </button>
          ))}
        </div>
        <div className="interval-group">
          {intervals.map((item) => (
            <button
              key={item}
              className={item === interval ? 'btn active' : 'btn'}
              onClick={() => setInterval(item)}
            >
              {item}
            </button>
          ))}
        </div>
        <div className="toolbar-actions">
          <button className="btn primary" onClick={() => setShowPicker((v) => !v)}>
            指标
          </button>
        </div>
      </header>

      <div className="workspace">
        <aside className="left-panel">
          <div className="panel-card">
            <div className="panel-title">已加载指标</div>
            {instances.length === 0 ? (
              <div className="empty-text">暂无指标，点击右上角“指标”添加。</div>
            ) : (
              <div className="indicator-list">
                {instances.map((item) => (
                  <div key={item.id} className="indicator-row">
                    <span>{formatIndicatorName(item)}</span>
                    <button className="mini-btn danger" onClick={() => removeIndicator(item.id)}>
                      删除
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {showPicker && (
            <div className="panel-card">
              <div className="panel-title">指标列表（点击添加）</div>
              <div className="picker-list">
                {indicatorTypes.map((type) => (
                  <button
                    key={type}
                    className="picker-item"
                    onClick={() => addIndicator(type)}
                    title="点击添加"
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>
          )}
        </aside>

        <main className="main-chart">
          <div className="chart-header">
            <div className="chart-title">{symbol} 永续 · {interval}</div>
            <div className="chart-note">时间轴已隐藏 · 当前为 Tauri 整合骨架版</div>
          </div>
          <div className="chart-wrap">
            <KlineMockChart />
          </div>
        </main>
      </div>
    </div>
  )
}
