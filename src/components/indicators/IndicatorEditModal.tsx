import { useEffect, useState } from 'react'
import type { IndicatorInstance } from './indicatorTypes'
import { formatIndicatorName } from './indicatorUtils'

const presetColors = ['#f0b90b', '#60a5fa', '#22c55e', '#a78bfa', '#f472b6', '#38bdf8', '#94a3b8', '#e5e7eb']

type Props = {
  indicator: IndicatorInstance | null
  onClose: () => void
  onSave: (next: IndicatorInstance) => void
  onDelete: (id: string) => void
}

export default function IndicatorEditModal({ indicator, onClose, onSave, onDelete }: Props) {
  const [draft, setDraft] = useState<IndicatorInstance | null>(indicator)

  useEffect(() => {
    setDraft(indicator)
  }, [indicator])

  if (!indicator || !draft) return null

  const setParam = (key: string, value: number) => {
    const next = {
      ...draft,
      params: { ...draft.params, [key]: value },
    }
    next.name = formatIndicatorName(next)
    setDraft(next)
  }

  const setColor = (color: string) => {
    setDraft({
      ...draft,
      style: { ...draft.style, color },
    })
  }

  const setWidth = (width: number) => {
    setDraft({
      ...draft,
      style: { ...draft.style, width },
    })
  }

  return (
    <div className="modal-mask" onClick={onClose}>
      <div className="modal-card edit-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">编辑 {formatIndicatorName(draft)}</div>
          <button className="icon-btn" onClick={onClose}>✕</button>
        </div>

        <div className="form-grid">
          {Object.entries(draft.params).map(([key, value]) => (
            typeof value === 'number' ? (
              <label className="field" key={key}>
                <span>{key}</span>
                <input
                  type="number"
                  value={value}
                  onChange={(e) => setParam(key, Number(e.target.value))}
                />
              </label>
            ) : null
          ))}
        </div>

        <div className="style-panel">
          <div className="field">
            <span>颜色</span>
            <div className="color-row">
              {presetColors.map((color) => (
                <button
                  key={color}
                  className="color-swatch"
                  style={{ background: color, outline: draft.style.color === color ? '2px solid #fff' : 'none' }}
                  onClick={() => setColor(color)}
                  title={color}
                />
              ))}
              <input
                className="native-color"
                type="color"
                value={draft.style.color || '#60a5fa'}
                onChange={(e) => setColor(e.target.value)}
              />
            </div>
          </div>

          <label className="field">
            <span>线宽</span>
            <select
              className="select-input"
              value={draft.style.width || 2}
              onChange={(e) => setWidth(Number(e.target.value))}
            >
              <option value={1}>1</option>
              <option value={2}>2</option>
              <option value={3}>3</option>
              <option value={4}>4</option>
            </select>
          </label>
        </div>

        <div className="modal-actions">
          <button className="btn ghost-danger" onClick={() => onDelete(draft.id)}>删除指标</button>
          <div className="action-right">
            <button className="btn" onClick={onClose}>取消</button>
            <button className="btn primary" onClick={() => onSave(draft)}>保存</button>
          </div>
        </div>
      </div>
    </div>
  )
}
