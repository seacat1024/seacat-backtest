export type IndicatorType = 'MA' | 'EMA' | 'MACD' | 'RSI' | 'KDJ'

export type IndicatorPanel = 'main' | 'sub'

export type IndicatorInstance = {
  id: string
  type: IndicatorType
  panel: IndicatorPanel
  name: string
  visible: boolean
  params: Record<string, number | string>
  style: {
    color?: string
    width?: number
    lineStyle?: 'solid' | 'dashed' | 'dotted'
  }
}
