export type IndicatorLibraryItem = {
  id: string
  label: string
  desc: string
  kind: 'main' | 'sub'
}

export type MALineConfig = {
  id: number
  length: number
  color: string
  width: number
}

export type IndicatorCenterState = {
  selectedIds: string[]
  maLines: MALineConfig[]
}
