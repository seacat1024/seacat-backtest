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

type KlineCachePayload = {
  symbol: string
  interval: string
  savedAt: number
  bars: Bar[]
}

type PositionSide = 'long' | 'short'
type PositionState = {
  side: PositionSide
  qty: number
  entry: number
  entryBarIndex: number
}

type TradeRecord = {
  id: string
  side: PositionSide
  qty: number
  entryPrice: number
  entryBarIndex: number
  exitPrice?: number
  exitBarIndex?: number
  pnl?: number
  status: 'open' | 'closed'
}

const intervals = ['1m', '5m', '15m', '30m', '1h', '4h', '1d', '1W']
const symbols = ['BTCUSDT', 'ETHUSDT']
const replaySpeeds = [1, 2, 4, 8]
const STORAGE_KEY = 'seacat-backtest-indicator-profiles-v1'
const KLINE_CACHE_PREFIX = 'seacat-backtest-kline-cache-v1'
const KLINE_CACHE_TTL_MS = 1000 * 60 * 15
const DISPLAY_WINDOW = 140

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

function getKlineCacheKey(symbol: string, interval: string) {
  return `${KLINE_CACHE_PREFIX}:${symbol}:${interval}`
}

function loadKlineCache(symbol: string, interval: string): KlineCachePayload | null {
  try {
    const raw = localStorage.getItem(getKlineCacheKey(symbol, interval))
    if (!raw) return null
    const parsed = JSON.parse(raw) as KlineCachePayload
    if (!parsed || !Array.isArray(parsed.bars)) return null
    return parsed
  } catch {
    return null
  }
}

function saveKlineCache(symbol: string, interval: string, bars: Bar[]) {
  const payload: KlineCachePayload = { symbol, interval, savedAt: Date.now(), bars }
  localStorage.setItem(getKlineCacheKey(symbol, interval), JSON.stringify(payload))
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

async function fetchFuturesKlines(symbol: string, interval: string, limit = 500): Promise<Bar[]> {
  const url = `https://fapi.binance.com/fapi/v1/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Binance API ${res.status}`)
  const raw = await res.json()
  if (!Array.isArray(raw)) throw new Error('Unexpected Binance response')
  return raw.map((item: any) => ({
    open: Number(item[1]),
    high: Number(item[2]),
    low: Number(item[3]),
    close: Number(item[4]),
  }))
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
  const hist = macd.map((v, i) => (v === null || signal[i] === null ? null : v - (signal[i] as number)))
  return { macd, signal, hist }
}

function buildPolylinePoints(series: Array<number | null>, scaleY: (v: number) => number, xForIndex: (i: number) => number): string {
  return series.map((value, i) => value === null ? null : `${xForIndex(i)},${scaleY(value)}`).filter(Boolean).join(' ')
}

function formatPnl(v: number) {
  return `${v >= 0 ? '+' : ''}${v.toFixed(2)}`
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
                {typeof macd[hoverIndex] === 'number' ? `MACD ${fmt(macd[hoverIndex] as number)}` : ''}{' '}
                {typeof signal[hoverIndex] === 'number' ? `Signal ${fmt(signal[hoverIndex] as number)}` : ''}{' '}
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

function KlineChart({
  bars,
  state,
  loading,
  tradeRecords,
  currentPrice,
}: {
  bars: Bar[]
  state: IndicatorCenterState
  loading: boolean
  tradeRecords: TradeRecord[]
  currentPrice: number
}) {
  const [hover, setHover] = useState<HoverData>(null)
  const width = 1100
  const height = 420
  const padLeft = 20
  const candleGap = Math.max(5.8, Math.min(10.5, (width - 40) / Math.max(1, bars.length)))
  const closes = bars.map((b) => b.close)

  const maSeries = state.selectedIds.includes('MA')
    ? state.maLines.filter((line) => line.length > 0).map((line) => ({ ...line, kind: 'MA' as const, values: calcMA(closes, line.length) }))
    : []
  const emaSeries = state.selectedIds.includes('EMA')
    ? state.emaLines.filter((line) => line.length > 0).map((line) => ({ ...line, kind: 'EMA' as const, values: calcEMA(closes, line.length) }))
    : []

  const rsi = useMemo(() => calcRSI(closes, state.rsiPeriod), [closes, state.rsiPeriod])
  const { macd, signal, hist } = useMemo(() => calcMACD(closes, state.macdConfig.fast, state.macdConfig.slow, state.macdConfig.signal), [closes, state.macdConfig])

  const allSeries = [...maSeries, ...emaSeries]
  const allHighs = bars.map((b) => b.high)
  const allLows = bars.map((b) => b.low)
  allSeries.forEach((series) => series.values.forEach((v) => { if (typeof v === 'number') { allHighs.push(v); allLows.push(v) } }))
  tradeRecords.forEach((t) => {
    allHighs.push(t.entryPrice)
    allLows.push(t.entryPrice)
    if (typeof t.exitPrice === 'number') {
      allHighs.push(t.exitPrice)
      allLows.push(t.exitPrice)
    } else if (t.status === 'open' && currentPrice) {
      allHighs.push(currentPrice)
      allLows.push(currentPrice)
    }
  })

  const max = allHighs.length ? Math.max(...allHighs) : 1
  const min = allLows.length ? Math.min(...allLows) : 0
  const scaleY = (v: number) => {
    const pct = (v - min) / (max - min || 1)
    return height - 20 - pct * (height - 40)
  }
  const xForIndex = (i: number) => padLeft + i * candleGap + 3

  return (
    <>
      <div className="chart-stage">
        {loading ? <div className="loading-overlay">加载 Binance 合约 K 线中…</div> : null}
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="chart-svg"
          onMouseMove={(e) => {
            if (!bars.length) return
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

          {tradeRecords.map((record) => {
            if (record.entryBarIndex < 0 || record.entryBarIndex >= bars.length) return null
            const entryX = xForIndex(record.entryBarIndex)
            const entryY = scaleY(record.entryPrice)
            const isClosed = record.status === 'closed' && typeof record.exitBarIndex === 'number' && typeof record.exitPrice === 'number'
            const exitX = isClosed ? xForIndex(record.exitBarIndex!) : xForIndex(bars.length - 1)
            const exitY = isClosed ? scaleY(record.exitPrice!) : scaleY(currentPrice || record.entryPrice)
            const lineColor = isClosed ? ((record.pnl ?? 0) >= 0 ? '#22c55e' : '#ef4444') : '#60a5fa'
            const fillColor = isClosed
              ? ((record.pnl ?? 0) >= 0 ? 'rgba(34,197,94,0.10)' : 'rgba(239,68,68,0.10)')
              : 'rgba(96,165,250,0.08)'
            const dash = isClosed ? undefined : '5 4'
            const leftX = Math.min(entryX, exitX)
            const rightX = Math.max(entryX, exitX)
            const topY = Math.min(entryY, exitY) - 10
            const bottomY = Math.max(entryY, exitY) + 10
            const midX = (entryX + exitX) / 2
            const midY = (entryY + exitY) / 2 - 10
            const pnlText = isClosed ? formatPnl(record.pnl ?? 0) : `持仓 ${record.side === 'long' ? '多' : '空'}`
            return (
              <g key={`link-${record.id}`}>
                <rect x={leftX} y={topY} width={Math.max(6, rightX - leftX)} height={Math.max(20, bottomY - topY)} fill={fillColor} rx="6" />
                <line x1={entryX} y1={entryY} x2={exitX} y2={exitY} stroke={lineColor} strokeWidth="2.5" strokeDasharray={dash} opacity="0.98" />
                <circle cx={entryX} cy={entryY} r="4" fill={lineColor} />
                <circle cx={exitX} cy={exitY} r="4" fill={lineColor} />
                <rect x={midX - 26} y={midY - 12} width="52" height="18" rx="6" fill="rgba(2,6,23,0.88)" stroke={lineColor} />
                <text x={midX} y={midY + 1} fill={lineColor} fontSize="11" fontWeight="700" textAnchor="middle">
                  {pnlText}
                </text>
              </g>
            )
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

          {tradeRecords.map((record) => {
            if (record.entryBarIndex < 0 || record.entryBarIndex >= bars.length) return null
            const entryX = xForIndex(record.entryBarIndex)
            const entryY = scaleY(record.entryPrice)
            const openTextY = record.side === 'long' ? entryY - 34 : entryY + 34
            const openTriangle = record.side === 'long'
              ? `${entryX},${entryY-26} ${entryX-8},${entryY-10} ${entryX+8},${entryY-10}`
              : `${entryX},${entryY+26} ${entryX-8},${entryY+10} ${entryX+8},${entryY+10}`
            const exitX = record.status === 'closed' && typeof record.exitBarIndex === 'number' ? xForIndex(record.exitBarIndex) : null
            const exitY = record.status === 'closed' && typeof record.exitPrice === 'number' ? scaleY(record.exitPrice) : null
            const exitTextY = exitY !== null ? exitY - 34 : null
            return (
              <g key={`marks-${record.id}`}>
                <polygon points={openTriangle} fill={record.side === 'long' ? '#4ade80' : '#f87171'} opacity="0.95" />
                <text x={entryX + 12} y={openTextY} fill={record.side === 'long' ? '#4ade80' : '#f87171'} fontSize="12" fontWeight="700">
                  {record.side === 'long' ? '开多' : '开空'}
                </text>
                {exitX !== null && exitY !== null && exitTextY !== null ? (
                  <>
                    <polygon points={`${exitX},${exitY-26} ${exitX-8},${exitY-10} ${exitX+8},${exitY-10}`} fill="#f0b90b" opacity="0.95" />
                    <text x={exitX + 12} y={exitTextY} fill="#f0b90b" fontSize="12" fontWeight="700">平仓</text>
                  </>
                ) : null}
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
  const [bars, setBars] = useState<Bar[]>([])
  const [loading, setLoading] = useState(true)
  const [dataError, setDataError] = useState('')
  const [cacheStatus, setCacheStatus] = useState<'none' | 'fresh' | 'stale' | 'remote'>('none')
  const [replayMode, setReplayMode] = useState(true)
  const [isPlaying, setIsPlaying] = useState(false)
  const [replaySpeed, setReplaySpeed] = useState(2)
  const [visibleCount, setVisibleCount] = useState(120)
  const [initialBalance, setInitialBalance] = useState(10000)
  const [balance, setBalance] = useState(10000)
  const [orderQty, setOrderQty] = useState(0.1)
  const [position, setPosition] = useState<PositionState | null>(null)
  const [realizedPnl, setRealizedPnl] = useState(0)
  const [tradeRecords, setTradeRecords] = useState<TradeRecord[]>([])

  useEffect(() => {
    const loaded = sanitizeState(profiles[symbol])
    setCenterState(loaded)
  }, [symbol, profiles])

  useEffect(() => {
    setProfiles((prev) => {
      const next = { ...prev, [symbol]: centerState }
      saveProfiles(next)
      return next
    })
  }, [symbol, centerState])

  useEffect(() => {
    let cancelled = false
    const cached = loadKlineCache(symbol, interval)
    const cacheAge = cached ? Date.now() - cached.savedAt : Number.MAX_SAFE_INTEGER
    const hasFreshCache = !!cached && cacheAge < KLINE_CACHE_TTL_MS

    if (cached?.bars?.length) {
      setBars(cached.bars)
      setCacheStatus(hasFreshCache ? 'fresh' : 'stale')
      setLoading(false)
    } else {
      setLoading(true)
      setCacheStatus('none')
    }

    setDataError('')
    setIsPlaying(false)

    fetchFuturesKlines(symbol, interval, 500)
      .then((nextBars) => {
        if (cancelled) return
        setBars(nextBars)
        saveKlineCache(symbol, interval, nextBars)
        setCacheStatus('remote')
        setLoading(false)
      })
      .catch((err) => {
        if (cancelled) return
        if (!cached?.bars?.length) {
          setBars(generateMockBars(120))
          setCacheStatus('none')
        }
        setDataError(`Binance 数据加载失败，${cached?.bars?.length ? '当前显示本地缓存数据' : '当前显示本地回退数据'}：${err instanceof Error ? err.message : 'unknown error'}`)
        setLoading(false)
      })

    return () => { cancelled = true }
  }, [symbol, interval])

  useEffect(() => {
    if (!bars.length) return
    const minStart = Math.min(120, bars.length)
    const maxStart = Math.max(minStart, bars.length - 80)
    const next = Math.max(minStart, Math.floor(Math.random() * (maxStart - minStart + 1)) + minStart)
    setVisibleCount(next)
  }, [bars])

  useEffect(() => {
    if (!replayMode || !isPlaying) return
    const timer = window.setInterval(() => {
      setVisibleCount((prev) => {
        if (prev >= bars.length) {
          window.clearInterval(timer)
          return prev
        }
        return Math.min(bars.length, prev + 1)
      })
    }, Math.max(80, 700 / replaySpeed))
    return () => window.clearInterval(timer)
  }, [replayMode, isPlaying, replaySpeed, bars.length])

  useEffect(() => {
    if (visibleCount >= bars.length && isPlaying) setIsPlaying(false)
  }, [visibleCount, bars.length, isPlaying])

  const replayBars = useMemo(() => {
    if (!replayMode) return bars
    const end = Math.max(1, Math.min(visibleCount, bars.length))
    const start = Math.max(0, end - DISPLAY_WINDOW)
    return bars.slice(start, end)
  }, [bars, replayMode, visibleCount])

  const currentPrice = replayBars.length ? replayBars[replayBars.length - 1].close : 0
  const visibleStart = replayMode ? Math.max(0, Math.max(1, Math.min(visibleCount, bars.length)) - DISPLAY_WINDOW) : 0
  const visibleTradeRecords = tradeRecords
    .filter((record) => {
      const entryVisible = record.entryBarIndex >= visibleStart && record.entryBarIndex < visibleStart + replayBars.length
      const exitVisible = typeof record.exitBarIndex === 'number' && record.exitBarIndex >= visibleStart && record.exitBarIndex < visibleStart + replayBars.length
      return entryVisible || exitVisible || record.status === 'open'
    })
    .map((record) => ({
      ...record,
      entryBarIndex: record.entryBarIndex - visibleStart,
      exitBarIndex: typeof record.exitBarIndex === 'number' ? record.exitBarIndex - visibleStart : undefined,
    }))

  const floatingPnl = position
    ? position.side === 'long'
      ? (currentPrice - position.entry) * position.qty
      : (position.entry - currentPrice) * position.qty
    : 0
  const equity = balance + floatingPnl

  const activeMAs = centerState.selectedIds.includes('MA') ? centerState.maLines.filter((line) => line.length > 0) : []
  const activeEMAs = centerState.selectedIds.includes('EMA') ? centerState.emaLines.filter((line) => line.length > 0) : []

  const restartReplay = () => {
    if (!bars.length) return
    const minStart = Math.min(120, bars.length)
    const maxStart = Math.max(minStart, bars.length - 80)
    const next = Math.max(minStart, Math.floor(Math.random() * (maxStart - minStart + 1)) + minStart)
    setVisibleCount(next)
    setIsPlaying(false)
  }

  const resetAccount = () => {
    setBalance(initialBalance)
    setRealizedPnl(0)
    setPosition(null)
    setTradeRecords([])
  }

  const openPosition = (side: PositionSide) => {
    if (!currentPrice || orderQty <= 0 || position) return
    const globalIndex = replayMode ? Math.max(0, Math.min(visibleCount, bars.length) - 1) : Math.max(0, bars.length - 1)
    const record: TradeRecord = {
      id: `${Date.now()}-${side}`,
      side,
      qty: orderQty,
      entryPrice: currentPrice,
      entryBarIndex: globalIndex,
      status: 'open',
    }
    setPosition({ side, qty: orderQty, entry: currentPrice, entryBarIndex: globalIndex })
    setTradeRecords((prev) => [...prev, record])
  }

  const closePosition = () => {
    if (!position || !currentPrice) return
    const exitIndex = replayMode ? Math.max(0, Math.min(visibleCount, bars.length) - 1) : Math.max(0, bars.length - 1)
    const pnl = position.side === 'long'
      ? (currentPrice - position.entry) * position.qty
      : (position.entry - currentPrice) * position.qty

    setBalance((prev) => prev + pnl)
    setRealizedPnl((prev) => prev + pnl)
    setTradeRecords((prev) => {
      const next = [...prev]
      for (let i = next.length - 1; i >= 0; i--) {
        if (next[i].status === 'open') {
          next[i] = {
            ...next[i],
            exitPrice: currentPrice,
            exitBarIndex: exitIndex,
            pnl,
            status: 'closed',
          }
          break
        }
      }
      return next
    })
    setPosition(null)
  }

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
          <button className={replayMode ? 'btn active compact-btn' : 'btn compact-btn'} onClick={() => { setReplayMode((prev) => !prev); setIsPlaying(false) }}>
            {replayMode ? '复盘中' : '看全图'}
          </button>
          <button className="btn secondary compact-btn" onClick={() => setCenterState(defaultIndicatorState())}>重置</button>
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
              <div className="chart-note">时间轴已隐藏 · v1.2.29 持仓高亮与专业交易UI版</div>
            </div>

            <div className="replay-toolbar">
              <button className="btn compact-btn" onClick={() => setIsPlaying((prev) => !prev)} disabled={!replayMode || !bars.length}>
                {isPlaying ? '暂停' : '播放'}
              </button>
              <button className="btn compact-btn" onClick={() => setVisibleCount((prev) => Math.min(bars.length, prev + 1))} disabled={!replayMode || visibleCount >= bars.length}>
                前进一步
              </button>
              <button className="btn compact-btn" onClick={restartReplay} disabled={!replayMode || !bars.length}>
                随机起点
              </button>
              <div className="speed-box">
                <span className="speed-label">速度</span>
                <select className="speed-select" value={replaySpeed} onChange={(e) => setReplaySpeed(Number(e.target.value))} disabled={!replayMode}>
                  {replaySpeeds.map((speed) => <option key={speed} value={speed}>{speed}x</option>)}
                </select>
              </div>
              <div className="progress-chip">进度：{replayMode ? Math.min(visibleCount, bars.length) : bars.length} / {bars.length || 0}</div>
            </div>

            <div className="trade-ui-panel">
              <div className="trade-card">
                <div className="trade-card-title">账户与下单</div>
                <div className="trade-grid">
                  <label>初始资金</label>
                  <input className="trade-input" type="number" value={initialBalance} onChange={(e) => setInitialBalance(Number(e.target.value) || 0)} />
                  <label>下单数量</label>
                  <input className="trade-input" type="number" value={orderQty} step="0.01" onChange={(e) => setOrderQty(Number(e.target.value) || 0)} />
                </div>
                <div className="trade-action-row">
                  <button className="btn compact-btn" onClick={resetAccount}>重置账户</button>
                  <button className="btn buy-btn compact-btn" onClick={() => openPosition('long')} disabled={!!position || !currentPrice}>开多</button>
                  <button className="btn sell-btn compact-btn" onClick={() => openPosition('short')} disabled={!!position || !currentPrice}>开空</button>
                  <button className="btn secondary compact-btn" onClick={closePosition} disabled={!position}>平仓</button>
                </div>
              </div>
              <div className="trade-ui-right">
                <div className="metric-card"><span className="metric-label">现价</span><span className="metric-value">{currentPrice.toFixed(2)}</span></div>
                <div className="metric-card"><span className="metric-label">余额</span><span className="metric-value">{balance.toFixed(2)}</span></div>
                <div className="metric-card"><span className="metric-label">浮盈亏</span><span className={`metric-value ${floatingPnl >= 0 ? 'up' : 'down'}`}>{formatPnl(floatingPnl)}</span></div>
                <div className="metric-card"><span className="metric-label">已实现</span><span className={`metric-value ${realizedPnl >= 0 ? 'up' : 'down'}`}>{formatPnl(realizedPnl)}</span></div>
                <div className="metric-card wide"><span className="metric-label">净值 / 持仓</span><span className="metric-value">{equity.toFixed(2)} · {position ? `${position.side === 'long' ? '多' : '空'} ${position.qty} @ ${position.entry.toFixed(2)}` : '暂无持仓'}</span></div>
              </div>
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
              <div className="persist-chip">指标已保存：{symbol}</div>
              <div className={`cache-chip ${cacheStatus}`}>{cacheStatus === 'fresh' ? 'K线缓存命中' : cacheStatus === 'stale' ? 'K线旧缓存' : cacheStatus === 'remote' ? 'K线远端已刷新' : '无缓存'}</div>
            </div>
            {dataError ? <div className="error-banner">{dataError}</div> : null}
          </div>

          <div className="chart-wrap compact-chart-wrap">
            <KlineChart bars={replayBars} state={centerState} loading={loading} tradeRecords={visibleTradeRecords} currentPrice={currentPrice} />
          </div>

          <div className="records-panel">
            <div className="records-title">交易记录</div>
            <div className="records-list">
              {tradeRecords.length === 0 ? <div className="record-empty">暂无交易记录</div> : tradeRecords.slice().reverse().map((record) => (
                <div key={record.id} className="record-row">
                  <span>{record.side === 'long' ? '多' : '空'}</span>
                  <span>开 {record.entryPrice.toFixed(2)}</span>
                  <span>量 {record.qty}</span>
                  <span>第 {record.entryBarIndex + 1} 根</span>
                  <span>{record.status === 'closed' && typeof record.exitPrice === 'number' ? `平 ${record.exitPrice.toFixed(2)}` : '持仓中'}</span>
                  <span className={(record.pnl ?? 0) >= 0 ? 'up' : 'down'}>{record.status === 'closed' ? `盈亏 ${(record.pnl ?? 0).toFixed(2)}` : '--'}</span>
                </div>
              ))}
            </div>
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
