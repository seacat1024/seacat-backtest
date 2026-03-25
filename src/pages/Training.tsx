import { useMemo, useState } from 'react'
import IndicatorCenterModal from '../components/indicators/IndicatorCenterModal'
import type { IndicatorCenterState } from '../components/indicators/types'

type Bar = { open: number; high: number; low: number; close: number }

const intervals = ['1m', '5m', '15m', '30m', '1h', '4h', '1d', '1W']
const symbols = ['BTCUSDT', 'ETHUSDT']

function generateMockBars(count = 120): Bar[] {
  const out: Bar[] = []
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

function calcMA(values: number[], length: number): Array<number | null> {
  return values.map((_, i) => {
    if (length <= 0 || i + 1 < length) return null
    const slice = values.slice(i + 1 - length, i + 1)
    return slice.reduce((a, b) => a + b, 0) / length
  })
}

function calcEMA(values: number[], length: number): Array<number | null> {
  if (length <= 0) return values.map(() => null)
  const k = 2 / (length + 1)
  const out: Array<number | null> = []
  let ema: number | null = null
  values.forEach((value, i) => {
    if (i + 1 < length) {
      out.push(null)
      return
    }
    if (ema === null) {
      const seed = values.slice(i + 1 - length, i + 1).reduce((a, b) => a + b, 0) / length
      ema = seed
    } else {
      ema = value * k + ema * (1 - k)
    }
    out.push(ema)
  })
  return out
}

function buildPolylinePoints(
  series: Array<number | null>,
  scaleY: (v: number) => number,
  xForIndex: (i: number) => number,
): string {
  return series
    .map((value, i) => (value === null ? null : `${xForIndex(i)},${scaleY(value)}`))
    .filter(Boolean)
    .join(' ')
}

function KlineMockChart({ state }: { state: IndicatorCenterState }) {
  const bars = useMemo(() => generateMockBars(100), [])
  const width = 1100
  const height = 420
  const padLeft = 20
  const candleGap = 10.5
  const closes = bars.map((b) => b.close)

  const maSeries = state.selectedIds.includes('MA')
    ? state.maLines.filter((line) => line.length > 0).map((line) => ({ ...line, kind: 'MA' as const, values: calcMA(closes, line.length) }))
    : []

  const emaSeries = state.selectedIds.includes('EMA')
    ? state.emaLines.filter((line) => line.length > 0).map((line) => ({ ...line, kind: 'EMA' as const, values: calcEMA(closes, line.length) }))
    : []

  const allSeries = [...maSeries, ...emaSeries]
  const allHighs = bars.map((b) => b.high)
  const allLows = bars.map((b) => b.low)
  allSeries.forEach((series) => {
    series.values.forEach((v) => {
      if (typeof v === 'number') {
        allHighs.push(v)
        allLows.push(v)
      }
    })
  })

  const max = Math.max(...allHighs)
  const min = Math.min(...allLows)
  const scaleY = (v: number) => {
    const pct = (v - min) / (max - min || 1)
    return height - 20 - pct * (height - 40)
  }
  const xForIndex = (i: number) => padLeft + i * candleGap + 3

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="chart-svg">
      <rect x="0" y="0" width={width} height={height} fill="#0b0e11" />
      {Array.from({ length: 6 }).map((_, i) => {
        const y = 20 + i * ((height - 40) / 5)
        return <line key={i} x1="0" y1={y} x2={width} y2={y} stroke="#1f2937" strokeWidth="1" />
      })}

      {allSeries.map((line) => (
        <polyline
          key={`${line.kind}-${line.id}`}
          points={buildPolylinePoints(line.values, scaleY, xForIndex)}
          fill="none"
          stroke={line.color}
          strokeWidth={line.width}
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.95"
        />
      ))}

      {bars.map((b, i) => {
        const x = padLeft + i * candleGap
        const openY = scaleY(b.open)
        const closeY = scaleY(b.close)
        const highY = scaleY(b.high)
        const lowY = scaleY(b.low)
        const up = b.close >= b.open
        const bodyY = Math.min(openY, closeY)
        const bodyH = Math.max(2, Math.abs(closeY - openY))
        return (
          <g key={i}>
            <line x1={x + 3} y1={highY} x2={x + 3} y2={lowY} stroke={up ? '#0ECB81' : '#F6465D'} strokeWidth="1.1" />
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
  const [open, setOpen] = useState(false)
  const [centerState, setCenterState] = useState<IndicatorCenterState>({
    selectedIds: ['MA', 'EMA'],
    maLines: [
      { id: 1, length: 7, color: '#ffffff', width: 1 },
      { id: 2, length: 30, color: '#f0b90b', width: 2 },
      { id: 3, length: 0, color: '#a855f7', width: 2 },
      { id: 4, length: 0, color: '#38bdf8', width: 2 },
      { id: 5, length: 0, color: '#22c55e', width: 2 },
      { id: 6, length: 0, color: '#ef4444', width: 2 },
      { id: 7, length: 0, color: '#60a5fa', width: 2 },
      { id: 8, length: 0, color: '#f59e0b', width: 2 },
      { id: 9, length: 0, color: '#9333ea', width: 2 },
      { id: 10, length: 0, color: '#ec4899', width: 2 },
    ],
    emaLines: [
      { id: 1, length: 7, color: '#ffffff', width: 1 },
      { id: 2, length: 30, color: '#f0b90b', width: 2 },
      { id: 3, length: 0, color: '#a855f7', width: 2 },
      { id: 4, length: 0, color: '#38bdf8', width: 2 },
      { id: 5, length: 0, color: '#22c55e', width: 2 },
      { id: 6, length: 0, color: '#ef4444', width: 2 },
      { id: 7, length: 0, color: '#60a5fa', width: 2 },
      { id: 8, length: 0, color: '#f59e0b', width: 2 },
      { id: 9, length: 0, color: '#9333ea', width: 2 },
      { id: 10, length: 0, color: '#ec4899', width: 2 },
    ],
  })

  const activeMAs = centerState.selectedIds.includes('MA') ? centerState.maLines.filter((line) => line.length > 0) : []
  const activeEMAs = centerState.selectedIds.includes('EMA') ? centerState.emaLines.filter((line) => line.length > 0) : []

  return (
    <div className="app-shell">
      <header className="topbar compact-top">
        <div className="brand compact-brand">SeaCat Backtest</div>

        <div className="symbol-group">
          {symbols.map((item) => (
            <button key={item} className={item === symbol ? 'btn active compact-btn' : 'btn compact-btn'} onClick={() => setSymbol(item)}>
              {item}
            </button>
          ))}
        </div>

        <div className="interval-group">
          {intervals.map((item) => (
            <button key={item} className={item === interval ? 'btn active compact-btn' : 'btn compact-btn'} onClick={() => setInterval(item)}>
              {item}
            </button>
          ))}
        </div>

        <div className="toolbar-actions">
          <button className="btn primary only-icon compact-icon-btn" onClick={() => setOpen(true)} title="指标中心">
            <span className="toolbar-icon">ƒx</span>
          </button>
        </div>
      </header>

      <div className="workspace solo compact-workspace">
        <main className="main-chart">
          <div className="chart-header stacked compact-chart-header">
            <div className="chart-header-top">
              <div className="chart-title">{symbol} 永续 · {interval}</div>
              <div className="chart-note">时间轴已隐藏 · v1.2.9 紧凑布局版</div>
            </div>

            <div className="loaded-indicators-bar compact-loaded">
              {activeMAs.map((line) => (
                <div key={`ma-${line.id}`} className="indicator-chip passive compact-chip">
                  <span className="dot" style={{ background: line.color }} />
                  <span>MA({line.length})</span>
                </div>
              ))}
              {activeEMAs.map((line) => (
                <div key={`ema-${line.id}`} className="indicator-chip passive compact-chip">
                  <span className="dot" style={{ background: line.color }} />
                  <span>EMA({line.length})</span>
                </div>
              ))}
              {activeMAs.length === 0 && activeEMAs.length === 0 ? (
                <div className="empty-inline">当前未显示 MA / EMA。</div>
              ) : null}
            </div>
          </div>

          <div className="chart-wrap compact-chart-wrap">
            <KlineMockChart state={centerState} />
          </div>
        </main>
      </div>

      <IndicatorCenterModal
        open={open}
        value={centerState}
        onClose={() => setOpen(false)}
        onSave={(next) => {
          setCenterState(next)
          setOpen(false)
        }}
      />
    </div>
  )
}
