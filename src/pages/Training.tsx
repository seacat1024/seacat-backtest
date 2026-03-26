import { useEffect, useMemo, useState } from 'react'
import IndicatorCenterModal from '../components/indicators/IndicatorCenterModal'
import type { IndicatorCenterState } from '../components/indicators/types'

type Bar = { open: number; high: number; low: number; close: number }
type HoverData = {
  index: number
  x: number
  y: number
  bar: Bar
  maValues: Array<{ label: string; value: number }>
  emaValues: Array<{ label: string; value: number }>
  rsi?: number
  macd?: number
  signal?: number
  hist?: number
} | null

const intervals = ['1m', '5m', '15m', '30m', '1h', '4h', '1d', '1W']
const symbols = ['BTCUSDT', 'ETHUSDT']
const STORAGE_KEY = 'seacat-backtest-indicator-profiles-v1'

const defaultIndicatorState = (): IndicatorCenterState => ({
  selectedIds: ['MA', 'EMA', 'RSI', 'MACD'],
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
    { id: 10, length: 0, color: '#ec4899', width: 2 }
  ],
  emaLines: [
    { id: 1, length: 0, color: '#ffffff', width: 1 },
    { id: 2, length: 0, color: '#f0b90b', width: 2 },
    { id: 3, length: 55, color: '#ef4444', width: 2 },
    { id: 4, length: 144, color: '#22c55e', width: 2 },
    { id: 5, length: 233, color: '#ffffff', width: 2 },
    { id: 6, length: 0, color: '#38bdf8', width: 2 },
    { id: 7, length: 0, color: '#60a5fa', width: 2 },
    { id: 8, length: 0, color: '#f59e0b', width: 2 },
    { id: 9, length: 0, color: '#9333ea', width: 2 },
    { id: 10, length: 0, color: '#ec4899', width: 2 }
  ],
  rsiPeriod: 14,
  macdConfig: { fast: 12, slow: 26, signal: 9 }
})

function loadProfiles(): Record<string, IndicatorCenterState> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw)
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

function saveProfiles(profiles: Record<string, IndicatorCenterState>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(profiles))
}

function sanitizeState(input: Partial<IndicatorCenterState> | undefined): IndicatorCenterState {
  const defaults = defaultIndicatorState()
  if (!input) return defaults
  return {
    selectedIds: Array.isArray(input.selectedIds) ? input.selectedIds : defaults.selectedIds,
    maLines: Array.isArray(input.maLines) && input.maLines.length === defaults.maLines.length ? input.maLines : defaults.maLines,
    emaLines: Array.isArray(input.emaLines) && input.emaLines.length === defaults.emaLines.length ? input.emaLines : defaults.emaLines,
    rsiPeriod: typeof input.rsiPeriod === 'number' && input.rsiPeriod > 0 ? input.rsiPeriod : defaults.rsiPeriod,
    macdConfig: {
      fast: typeof input.macdConfig?.fast === 'number' && input.macdConfig.fast > 0 ? input.macdConfig.fast : defaults.macdConfig.fast,
      slow: typeof input.macdConfig?.slow === 'number' && input.macdConfig.slow > 0 ? input.macdConfig.slow : defaults.macdConfig.slow,
      signal: typeof input.macdConfig?.signal === 'number' && input.macdConfig.signal > 0 ? input.macdConfig.signal : defaults.macdConfig.signal,
    },
  }
}

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

function calcRSI(values: number[], period = 14): Array<number | null> {
  const out: Array<number | null> = values.map(() => null)
  if (values.length <= period) return out
  let gain = 0
  let loss = 0
  for (let i = 1; i <= period; i++) {
    const diff = values[i] - values[i - 1]
    if (diff >= 0) gain += diff
    else loss -= diff
  }
  let avgGain = gain / period
  let avgLoss = loss / period
  out[period] = avgLoss === 0 ? 100 : 100 - (100 / (1 + avgGain / avgLoss))
  for (let i = period + 1; i < values.length; i++) {
    const diff = values[i] - values[i - 1]
    const g = diff > 0 ? diff : 0
    const l = diff < 0 ? -diff : 0
    avgGain = (avgGain * (period - 1) + g) / period
    avgLoss = (avgLoss * (period - 1) + l) / period
    out[i] = avgLoss === 0 ? 100 : 100 - (100 / (1 + avgGain / avgLoss))
  }
  return out
}

function calcMACD(values: number[], fast = 12, slow = 26, signalPeriod = 9) {
  const emaFast = calcEMA(values, fast)
  const emaSlow = calcEMA(values, slow)
  const macd: Array<number | null> = values.map((_, i) => (
    typeof emaFast[i] === 'number' && typeof emaSlow[i] === 'number' ? (emaFast[i] as number) - (emaSlow[i] as number) : null
  ))
  const macdClean = macd.map(v => v ?? 0)
  const signalBase = calcEMA(macdClean, signalPeriod)
  const signal = macd.map((v, i) => (v === null || signalBase[i] === null ? null : signalBase[i]))
  const hist = macd.map((v, i) => (
    v === null || signal[i] === null ? null : v - (signal[i] as number)
  ))
  return { macd, signal, hist }
}

function buildPolylinePoints(series: Array<number | null>, scaleY: (v: number) => number, xForIndex: (i: number) => number): string {
  return series.map((value, i) => value === null ? null : `${xForIndex(i)},${scaleY(value)}`).filter(Boolean).join(' ')
}

function IndicatorSubcharts({
  closes,
  xForIndex,
  hoverIndex,
  rsiPeriod,
  macdConfig,
  showRsi,
  showMacd,
}: {
  closes: number[]
  xForIndex: (i: number) => number
  hoverIndex: number | null
  rsiPeriod: number
  macdConfig: { fast: number; slow: number; signal: number }
  showRsi: boolean
  showMacd: boolean
}) {
  const rsi = useMemo(() => calcRSI(closes, rsiPeriod), [closes, rsiPeriod])
  const { macd, signal, hist } = useMemo(() => calcMACD(closes, macdConfig.fast, macdConfig.slow, macdConfig.signal), [closes, macdConfig])
  const width = 1100
  const rsiTop = 18
  const rsiBottom = 122
  const scaleRsi = (v: number) => rsiBottom - (v / 100) * (rsiBottom - rsiTop)
  const macdVals = [...macd, ...signal, ...hist].filter((v): v is number => typeof v === 'number')
  const macdAbsRaw = macdVals.length ? Math.max(...macdVals.map(v => Math.abs(v))) : 1
  const macdAbs = Math.max(macdAbsRaw * 1.25, 0.5)
  const macdTop = 18
  const macdBottom = 122
  const macdMid = 70
  const scaleMacd = (v: number) => macdMid - (v / macdAbs) * ((macdBottom - macdTop) / 2 - 6)
  const fmt = (n: number) => n.toFixed(2)

  return (
    <div className="subcharts">
      {showRsi ? (
        <div className="subchart-box">
          <div className="subchart-head">
            <span>RSI({rsiPeriod})</span>
            {hoverIndex !== null && typeof rsi[hoverIndex] === 'number' ? <span className="subchart-value">RSI {fmt(rsi[hoverIndex] as number)}</span> : null}
          </div>
          <svg viewBox={`0 0 ${width} 140`} className="subchart-svg">
            <rect x="0" y="0" width={width} height="140" fill="#0b0e11" />
            <line x1="0" y1={scaleRsi(70)} x2={width} y2={scaleRsi(70)} stroke="#475569" strokeDasharray="4 4" />
            <line x1="0" y1={scaleRsi(50)} x2={width} y2={scaleRsi(50)} stroke="#334155" strokeDasharray="3 5" />
            <line x1="0" y1={scaleRsi(30)} x2={width} y2={scaleRsi(30)} stroke="#475569" strokeDasharray="4 4" />
            <text x="6" y={scaleRsi(70)-4} fill="#94a3b8" fontSize="10">70</text>
            <text x="6" y={scaleRsi(50)-4} fill="#64748b" fontSize="10">50</text>
            <text x="6" y={scaleRsi(30)-4} fill="#94a3b8" fontSize="10">30</text>
            <polyline points={buildPolylinePoints(rsi, scaleRsi, xForIndex)} fill="none" stroke="#38bdf8" strokeWidth="2" />
            {hoverIndex !== null ? <line x1={xForIndex(hoverIndex)} y1="0" x2={xForIndex(hoverIndex)} y2="140" stroke="#94a3b8" strokeDasharray="4 4" /> : null}
          </svg>
        </div>
      ) : null}

      {showMacd ? (
        <div className="subchart-box">
          <div className="subchart-head">
            <span>MACD({macdConfig.fast},{macdConfig.slow},{macdConfig.signal})</span>
            {hoverIndex !== null ? (
              <span className="subchart-value">
                {typeof macd[hoverIndex] === 'number' ? `MACD ${fmt(macd[hoverIndex] as number)}` : ''}{" "}
                {typeof signal[hoverIndex] === 'number' ? `Signal ${fmt(signal[hoverIndex] as number)}` : ''}{" "}
                {typeof hist[hoverIndex] === 'number' ? `Hist ${fmt(hist[hoverIndex] as number)}` : ''}
              </span>
            ) : null}
          </div>
          <svg viewBox={`0 0 ${width} 140`} className="subchart-svg">
            <rect x="0" y="0" width={width} height="140" fill="#0b0e11" />
            <line x1="0" y1={scaleMacd(macdAbs)} x2={width} y2={scaleMacd(macdAbs)} stroke="#1e293b" strokeDasharray="3 5" />
            <line x1="0" y1={scaleMacd(0)} x2={width} y2={scaleMacd(0)} stroke="#334155" />
            <line x1="0" y1={scaleMacd(-macdAbs)} x2={width} y2={scaleMacd(-macdAbs)} stroke="#1e293b" strokeDasharray="3 5" />
            <text x="6" y={scaleMacd(macdAbs)-4} fill="#64748b" fontSize="10">{fmt(macdAbs)}</text>
            <text x="6" y={scaleMacd(0)-4} fill="#94a3b8" fontSize="10">0</text>
            <text x="6" y={scaleMacd(-macdAbs)-4} fill="#64748b" fontSize="10">{fmt(-macdAbs)}</text>
            {hist.map((v, i) => {
              if (v === null) return null
              const x = xForIndex(i) - 2
              const y0 = scaleMacd(0)
              const y = scaleMacd(v)
              return <rect key={i} x={x} y={Math.min(y, y0)} width="5" height={Math.max(1, Math.abs(y0 - y))} fill={v >= 0 ? '#22c55e' : '#ef4444'} opacity="0.9" />
            })}
            <polyline points={buildPolylinePoints(macd, scaleMacd, xForIndex)} fill="none" stroke="#f0b90b" strokeWidth="2" />
            <polyline points={buildPolylinePoints(signal, scaleMacd, xForIndex)} fill="none" stroke="#60a5fa" strokeWidth="2" />
            {hoverIndex !== null ? <line x1={xForIndex(hoverIndex)} y1="0" x2={xForIndex(hoverIndex)} y2="140" stroke="#94a3b8" strokeDasharray="4 4" /> : null}
          </svg>
        </div>
      ) : null}
    </div>
  )
}

function KlineMockChart({ state }: { state: IndicatorCenterState }) {
  const bars = useMemo(() => generateMockBars(100), [])
  const [hover, setHover] = useState<HoverData>(null)
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

  const rsi = useMemo(() => calcRSI(closes, state.rsiPeriod), [closes, state.rsiPeriod])
  const { macd, signal, hist } = useMemo(
    () => calcMACD(closes, state.macdConfig.fast, state.macdConfig.slow, state.macdConfig.signal),
    [closes, state.macdConfig]
  )

  const allSeries = [...maSeries, ...emaSeries]
  const allHighs = bars.map((b) => b.high)
  const allLows = bars.map((b) => b.low)
  allSeries.forEach((series) => series.values.forEach((v) => { if (typeof v === 'number') { allHighs.push(v); allLows.push(v) } }))

  const max = Math.max(...allHighs)
  const min = Math.min(...allLows)
  const scaleY = (v: number) => {
    const pct = (v - min) / (max - min || 1)
    return height - 20 - pct * (height - 40)
  }
  const xForIndex = (i: number) => padLeft + i * candleGap + 3

  return (
    <>
      <div className="chart-stage">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="chart-svg"
          onMouseMove={(e) => {
            const rect = (e.currentTarget as SVGSVGElement).getBoundingClientRect()
            const px = ((e.clientX - rect.left) / rect.width) * width
            const py = ((e.clientY - rect.top) / rect.height) * height
            const idx = Math.max(0, Math.min(bars.length - 1, Math.round((px - padLeft - 3) / candleGap)))
            const bar = bars[idx]
            const maValues = maSeries.map((s) => ({ label: `MA(${s.length})`, value: s.values[idx] })).filter((x): x is { label: string; value: number } => typeof x.value === 'number')
            const emaValues = emaSeries.map((s) => ({ label: `EMA(${s.length})`, value: s.values[idx] })).filter((x): x is { label: string; value: number } => typeof x.value === 'number')
            setHover({
              index: idx,
              x: xForIndex(idx),
              y: py,
              bar,
              maValues,
              emaValues,
              rsi: typeof rsi[idx] === 'number' ? rsi[idx] as number : undefined,
              macd: typeof macd[idx] === 'number' ? macd[idx] as number : undefined,
              signal: typeof signal[idx] === 'number' ? signal[idx] as number : undefined,
              hist: typeof hist[idx] === 'number' ? hist[idx] as number : undefined,
            })
          }}
          onMouseLeave={() => setHover(null)}
        >
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
          {hover ? (
            <g>
              <line x1={hover.x} y1="0" x2={hover.x} y2={height} stroke="#94a3b8" strokeDasharray="4 4" strokeWidth="1" opacity="0.9" />
              <line x1="0" y1={hover.y} x2={width} y2={hover.y} stroke="#94a3b8" strokeDasharray="4 4" strokeWidth="1" opacity="0.9" />
            </g>
          ) : null}
        </svg>

        {hover ? (
          <div className="hover-panel">
            <div className="hover-title">K线 {hover.index + 1}</div>
            <div className="hover-row"><span>开</span><strong>{hover.bar.open.toFixed(2)}</strong></div>
            <div className="hover-row"><span>高</span><strong>{hover.bar.high.toFixed(2)}</strong></div>
            <div className="hover-row"><span>低</span><strong>{hover.bar.low.toFixed(2)}</strong></div>
            <div className="hover-row"><span>收</span><strong>{hover.bar.close.toFixed(2)}</strong></div>
            {hover.maValues.map((item) => <div className="hover-row" key={item.label}><span>{item.label}</span><strong>{item.value.toFixed(2)}</strong></div>)}
            {hover.emaValues.map((item) => <div className="hover-row" key={item.label}><span>{item.label}</span><strong>{item.value.toFixed(2)}</strong></div>)}
            {typeof hover.rsi === 'number' ? <div className="hover-row"><span>RSI({state.rsiPeriod})</span><strong>{hover.rsi.toFixed(2)}</strong></div> : null}
            {typeof hover.macd === 'number' ? <div className="hover-row"><span>MACD</span><strong>{hover.macd.toFixed(2)}</strong></div> : null}
            {typeof hover.signal === 'number' ? <div className="hover-row"><span>Signal</span><strong>{hover.signal.toFixed(2)}</strong></div> : null}
            {typeof hover.hist === 'number' ? <div className="hover-row"><span>Hist</span><strong>{hover.hist.toFixed(2)}</strong></div> : null}
          </div>
        ) : null}
      </div>

      <IndicatorSubcharts
        closes={closes}
        xForIndex={xForIndex}
        hoverIndex={hover ? hover.index : null}
        rsiPeriod={state.rsiPeriod}
        macdConfig={state.macdConfig}
        showRsi={state.selectedIds.includes('RSI')}
        showMacd={state.selectedIds.includes('MACD')}
      />
    </>
  )
}

export default function TrainingPage() {
  const [symbol, setSymbol] = useState('BTCUSDT')
  const [interval, setInterval] = useState('15m')
  const [open, setOpen] = useState(false)
  const [profiles, setProfiles] = useState<Record<string, IndicatorCenterState>>(() => loadProfiles())
  const [centerState, setCenterState] = useState<IndicatorCenterState>(() => sanitizeState(loadProfiles()['BTCUSDT']))

  useEffect(() => {
    const loaded = sanitizeState(profiles[symbol])
    setCenterState(loaded)
  }, [symbol])

  useEffect(() => {
    setProfiles((prev) => {
      const next = { ...prev, [symbol]: centerState }
      saveProfiles(next)
      return next
    })
  }, [symbol, centerState])

  const activeMAs = centerState.selectedIds.includes('MA') ? centerState.maLines.filter((line) => line.length > 0) : []
  const activeEMAs = centerState.selectedIds.includes('EMA') ? centerState.emaLines.filter((line) => line.length > 0) : []

  return (
    <div className="app-shell">
      <header className="topbar compact-top">
        <div className="brand compact-brand">SeaCat Backtest</div>
        <div className="symbol-group">
          {symbols.map((item) => (
            <button key={item} className={item === symbol ? 'btn active compact-btn' : 'btn compact-btn'} onClick={() => setSymbol(item)}>{item}</button>
          ))}
        </div>
        <div className="interval-group">
          {intervals.map((item) => (
            <button key={item} className={item === interval ? 'btn active compact-btn' : 'btn compact-btn'} onClick={() => setInterval(item)}>{item}</button>
          ))}
        </div>
        <div className="toolbar-actions">
          <button className="btn secondary compact-btn" onClick={() => {
            const defaults = defaultIndicatorState()
            setCenterState(defaults)
          }} title="恢复当前交易对默认指标">重置</button>
          <button className="btn primary only-icon compact-icon-btn" onClick={() => setOpen(true)} title="指标中心">
            <span className="toolbar-icon">ƒx</span>
          </button>
        </div>
      </header>

      <div className="workspace compact-workspace">
        <main className="main-chart">
          <div className="chart-header stacked compact-chart-header">
            <div className="chart-header-top">
              <div className="chart-title">{symbol} 永续 · {interval}</div>
              <div className="chart-note">时间轴已隐藏 · v1.2.20 localStorage per symbol</div>
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
              {centerState.selectedIds.includes('RSI') ? <div className="indicator-chip passive compact-chip"><span className="dot" style={{ background: '#38bdf8' }} />RSI({centerState.rsiPeriod})</div> : null}
              {centerState.selectedIds.includes('MACD') ? <div className="indicator-chip passive compact-chip"><span className="dot" style={{ background: '#f0b90b' }} />MACD({centerState.macdConfig.fast},{centerState.macdConfig.slow},{centerState.macdConfig.signal})</div> : null}
              <div className="persist-chip">已保存到本地：{symbol}</div>
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
        onSave={(next) => { setCenterState(sanitizeState(next)); setOpen(false) }}
      />
    </div>
  )
}
