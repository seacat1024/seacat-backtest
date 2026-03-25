import { useMemo, useState } from 'react'
import type { IndicatorCenterState, IndicatorLibraryItem, MultiLineConfig } from './types'

const COLORS = ['#ef4444', '#22c55e', '#60a5fa', '#a78bfa', '#ffffff', '#f0b90b', '#f472b6', '#38bdf8']
const WIDTHS = [1, 2, 3, 4, 5, 6]

type Props = {
  open: boolean
  value: IndicatorCenterState
  onClose: () => void
  onSave: (next: IndicatorCenterState) => void
}

const LIBRARY: IndicatorLibraryItem[] = [
  { id: 'MA', label: 'MA', desc: '简单移动平均线', kind: 'main' },
  { id: 'EMA', label: 'EMA', desc: '指数移动平均线', kind: 'main' },
  { id: 'BOLL', label: 'BOLL', desc: '布林线', kind: 'main' },
  { id: 'RSI', label: 'RSI', desc: '相对强弱指标', kind: 'sub' },
  { id: 'MACD', label: 'MACD', desc: '趋势动量指标', kind: 'sub' },
  { id: 'KDJ', label: 'KDJ', desc: '随机摆动指标', kind: 'sub' },
]

function SeriesEditor({
  prefix,
  lines,
  updateLine,
}: {
  prefix: string
  lines: MultiLineConfig[]
  updateLine: (id: number, patch: Partial<MultiLineConfig>) => void
}) {
  return (
    <div className="rows-grid">
      {lines.map((line, i) => (
        <div className="config-row" key={line.id}>
          <div className="row-label">{prefix}{i + 1}</div>
          <input
            className="param-input"
            type="text"
            inputMode="numeric"
            value={line.length === 0 ? '' : String(line.length)}
            onChange={(e) => {
              const raw = e.target.value.replace(/[^0-9]/g, '')
              updateLine(line.id, { length: raw === '' ? 0 : Number(raw) })
            }}
            placeholder="0"
          />
          <select
            className="param-select"
            value={line.width}
            onChange={(e) => updateLine(line.id, { width: Number(e.target.value) })}
          >
            {WIDTHS.map((w) => (
              <option key={w} value={w}>{w}</option>
            ))}
          </select>
          <div className="swatch-line">
            {COLORS.map((color) => (
              <button
                key={color}
                className="swatch-dot"
                style={{ background: color, outline: line.color === color ? '2px solid #fff' : 'none' }}
                onClick={() => updateLine(line.id, { color })}
                title={color}
              />
            ))}
            <input
              className="row-color-picker"
              type="color"
              value={line.color}
              onChange={(e) => updateLine(line.id, { color: e.target.value })}
              title="自定义颜色"
            />
          </div>
        </div>
      ))}
      <div className="hint-line">填 0 或留空 = 不显示；填数值 = 显示。</div>
    </div>
  )
}

export default function IndicatorCenterModal({ open, value, onClose, onSave }: Props) {
  const [leftTab, setLeftTab] = useState<'all' | 'selected'>('all')
  const [activeId, setActiveId] = useState<string>('MA')
  const [draft, setDraft] = useState<IndicatorCenterState>(value)

  const visibleList = useMemo(() => {
    return leftTab === 'all'
      ? LIBRARY
      : LIBRARY.filter((item) => draft.selectedIds.includes(item.id))
  }, [leftTab, draft.selectedIds])

  if (!open) return null

  const toggleSelected = (id: string) => {
    setDraft((prev) => {
      const exists = prev.selectedIds.includes(id)
      return {
        ...prev,
        selectedIds: exists ? prev.selectedIds.filter((x) => x !== id) : [...prev.selectedIds, id],
      }
    })
    setActiveId(id)
  }

  const updateLines = (key: 'maLines' | 'emaLines', id: number, patch: Partial<MultiLineConfig>) => {
    setDraft((prev) => ({
      ...prev,
      [key]: prev[key].map((line) => (line.id === id ? { ...line, ...patch } : line)),
    }))
  }

  return (
    <div className="center-mask" onClick={onClose}>
      <div className="center-shell" onClick={(e) => e.stopPropagation()}>
        <div className="center-head">
          <div className="center-title">指标中心</div>
          <button className="x-btn" onClick={onClose}>✕</button>
        </div>

        <div className="center-body">
          <aside className="center-left">
            <button className={leftTab === 'all' ? 'left-tab active' : 'left-tab'} onClick={() => setLeftTab('all')}>全部</button>
            <button className={leftTab === 'selected' ? 'left-tab active' : 'left-tab'} onClick={() => setLeftTab('selected')}>已选指标</button>
          </aside>

          <section className="center-list">
            <div className="search-lite">搜索指标</div>
            <div className="indicator-list2">
              {visibleList.map((item) => (
                <button
                  key={item.id}
                  className={activeId === item.id ? 'indicator-item2 active' : 'indicator-item2'}
                  onClick={() => setActiveId(item.id)}
                >
                  <div className="indicator-check" onClick={(e) => { e.stopPropagation(); toggleSelected(item.id) }}>
                    {draft.selectedIds.includes(item.id) ? '✓' : ''}
                  </div>
                  <div className="indicator-badge">{item.label}</div>
                  <div className="indicator-meta">
                    <div className="indicator-name">{item.label}</div>
                    <div className="indicator-desc">{item.desc}</div>
                  </div>
                </button>
              ))}
            </div>
          </section>

          <section className="center-settings">
            <div className="settings-top">
              <div className="settings-title">参数设置</div>
              <button className="reset-link" onClick={() => setDraft(value)}>恢复默认</button>
            </div>

            {activeId === 'MA' ? (
              <SeriesEditor prefix="MA" lines={draft.maLines} updateLine={(id, patch) => updateLines('maLines', id, patch)} />
            ) : activeId === 'EMA' ? (
              <SeriesEditor prefix="EMA" lines={draft.emaLines} updateLine={(id, patch) => updateLines('emaLines', id, patch)} />
            ) : (
              <div className="coming-soon">这一版先把指标中心比例重做。RSI / MACD / KDJ 下一版继续接副图。</div>
            )}
          </section>
        </div>

        <div className="center-footer">
          <button className="btn compact-btn" onClick={onClose}>取消</button>
          <button className="btn primary compact-btn" onClick={() => onSave(draft)}>应用</button>
        </div>
      </div>
    </div>
  )
}
