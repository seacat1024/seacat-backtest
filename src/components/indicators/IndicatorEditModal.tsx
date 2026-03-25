import { useEffect, useState } from 'react'
import type { IndicatorInstance } from './indicatorTypes'
import { formatIndicatorName } from './indicatorUtils'

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
