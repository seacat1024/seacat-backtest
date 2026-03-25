import type { IndicatorInstance, IndicatorType } from './indicatorTypes'
import { formatIndicatorName } from './indicatorUtils'

const randomId = () => `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`

export function createDefaultIndicator(type: IndicatorType): IndicatorInstance {
  const base: IndicatorInstance = (() => {
    switch (type) {
      case 'MA':
        return {
          id: randomId(),
          type,
          panel: 'main',
          name: 'MA(20)',
          visible: true,
          params: { length: 20, source: 'close' },
          style: { width: 2, color: '#f0b90b' },
        }
      case 'EMA':
        return {
          id: randomId(),
          type,
          panel: 'main',
          name: 'EMA(21)',
          visible: true,
          params: { length: 21, source: 'close' },
          style: { width: 2, color: '#60a5fa' },
        }
      case 'MACD':
        return {
          id: randomId(),
          type,
          panel: 'sub',
          name: 'MACD(12,26,9)',
          visible: true,
          params: { fast: 12, slow: 26, signal: 9 },
          style: { width: 2, color: '#22c55e' },
        }
      case 'RSI':
        return {
          id: randomId(),
          type,
          panel: 'sub',
          name: 'RSI(14)',
          visible: true,
          params: { length: 14 },
          style: { width: 2, color: '#a78bfa' },
        }
      case 'KDJ':
        return {
          id: randomId(),
          type,
          panel: 'sub',
          name: 'KDJ(9,3,3)',
          visible: true,
          params: { length: 9, k: 3, d: 3 },
          style: { width: 2, color: '#f472b6' },
        }
    }
  })()

  return { ...base, name: formatIndicatorName(base) }
}
