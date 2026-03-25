import type { IndicatorInstance } from './indicatorTypes'

export function formatIndicatorName(indicator: IndicatorInstance): string {
  switch (indicator.type) {
    case 'MA':
    case 'EMA':
    case 'RSI':
      return `${indicator.type}(${indicator.params.length})`
    case 'MACD':
      return `MACD(${indicator.params.fast},${indicator.params.slow},${indicator.params.signal})`
    case 'KDJ':
      return `KDJ(${indicator.params.length},${indicator.params.k},${indicator.params.d})`
    default:
      return indicator.name
  }
}
