import type { IndicatorInstance, IndicatorType } from './indicatorTypes'

const randomId = () => `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`

export function createDefaultIndicator(type: IndicatorType): IndicatorInstance {
  switch (type) {
    case 'MA':
      return {
        id: randomId(),
        type,
        panel: 'main',
        name: 'MA(20)',
        visible: true,
        params: { length: 20, source: 'close' },
        style: { width: 2 },
      }
    case 'EMA':
      return {
        id: randomId(),
        type,
        panel: 'main',
        name: 'EMA(21)',
        visible: true,
        params: { length: 21, source: 'close' },
        style: { width: 2 },
      }
    case 'MACD':
      return {
        id: randomId(),
        type,
        panel: 'sub',
        name: 'MACD(12,26,9)',
        visible: true,
        params: { fast: 12, slow: 26, signal: 9 },
        style: { width: 2 },
      }
    case 'RSI':
      return {
        id: randomId(),
        type,
        panel: 'sub',
        name: 'RSI(14)',
        visible: true,
        params: { length: 14 },
        style: { width: 2 },
      }
    case 'KDJ':
      return {
        id: randomId(),
        type,
        panel: 'sub',
        name: 'KDJ(9,3,3)',
        visible: true,
        params: { length: 9, k: 3, d: 3 },
        style: { width: 2 },
      }
  }
}
