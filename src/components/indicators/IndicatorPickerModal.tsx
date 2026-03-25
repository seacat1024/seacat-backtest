import { useMemo, useState } from 'react'
import type { IndicatorType } from './indicatorTypes'

const allIndicators: { type: IndicatorType; label: string; desc: string }[] = [
  { type: 'MA', label: 'MA', desc: '简单移动平均线' },
  { type: 'EMA', label: 'EMA', desc: '指数移动平均线' },
  { type: 'MACD', label: 'MACD', desc: '趋势动量指标' },
  { type: 'RSI', label: 'RSI', desc: '相对强弱指数' },
  { type: 'KDJ', label: 'KDJ', desc: '随机摆动指标' },
]

type Props = {
  open: boolean
  onClose: () => void
  onAdd: (type: IndicatorType) => void
}

export default function IndicatorPickerModal({ open, onClose, onAdd }: Props) {
  const [keyword, setKeyword] = useState('')

  const filtered = useMemo(() => {
    const q = keyword.trim().toLowerCase()
    if (!q) return allIndicators
    return allIndicators.filter((item) =>
      item.label.toLowerCase().includes(q) || item.desc.toLowerCase().includes(q),
    )
  }, [keyword])

  if (!open) return null

  return (
    <div className="modal-mask" onClick={onClose}>
      <div className="modal-card indicator-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">指标</div>
          <button className="icon-btn" onClick={onClose}>✕</button>
        </div>

        <div className="search-box">
          <input
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="搜索指标"
            className="search-input"
          />
        </div>

        <div className="indicator-modal-list">
          {filtered.map((item) => (
            <button
              key={item.label}
              className="indicator-modal-item"
              onDoubleClick={() => onAdd(item.type)}
              onClick={() => onAdd(item.type)}
            >
              <div className="indicator-modal-main">{item.label}</div>
              <div className="indicator-modal-desc">{item.desc}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
