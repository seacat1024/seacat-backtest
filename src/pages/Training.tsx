import { useMemo, useState } from 'react'
import { createDefaultIndicator } from '../components/indicators/indicatorDefaults'
import IndicatorEditModal from '../components/indicators/IndicatorEditModal'
import IndicatorPickerModal from '../components/indicators/IndicatorPickerModal'
import type { IndicatorInstance, IndicatorType } from '../components/indicators/indicatorTypes'
import { formatIndicatorName } from '../components/indicators/indicatorUtils'

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
  const [pickerOpen, setPickerOpen] = useState(false)
  const [editing, setEditing] = useState<IndicatorInstance | null>(null)

  const addIndicator = (type: IndicatorType) => {
    const next = createDefaultIndicator(type)
    setInstances((prev) => [...prev, next])
    setPickerOpen(false)
  }

  const deleteIndicator = (id: string) => {
    setInstances((prev) => prev.filter((item) => item.id !== id))
    setEditing(null)
  }

  const saveIndicator = (next: IndicatorInstance) => {
    setInstances((prev) => prev.map((item) => item.id === next.id ? next : item))
    setEditing(null)
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
          <button className="btn primary iconish" onClick={() => setPickerOpen(true)}>
            <span className="toolbar-icon">ƒx</span>
            <span>指标</span>
          </button>
        </div>
      </header>

      <div className="workspace solo">
        <main className="main-chart">
          <div className="chart-header stacked">
            <div className="chart-header-top">
              <div className="chart-title">{symbol} 永续 · {interval}</div>
              <div className="chart-note">时间轴已隐藏 · v1.2.3 指标交互升级版</div>
            </div>

            <div className="loaded-indicators-bar">
              {instances.length === 0 ? (
                <div className="empty-inline">暂无指标，点击右上角“指标”添加。</div>
              ) : (
                instances.map((item) => (
                  <button
                    key={item.id}
                    className="indicator-chip"
                    onClick={() => setEditing(item)}
                    title="点击编辑参数或删除"
                  >
                    <span className="dot" style={{ background: item.style.color || '#60a5fa' }} />
                    <span>{formatIndicatorName(item)}</span>
                  </button>
                ))
              )}
            </div>
          </div>

          <div className="chart-wrap">
            <KlineMockChart />
          </div>
        </main>
      </div>

      <IndicatorPickerModal
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onAdd={addIndicator}
      />

      <IndicatorEditModal
        indicator={editing}
        onClose={() => setEditing(null)}
        onSave={saveIndicator}
        onDelete={deleteIndicator}
      />
    </div>
  )
}
