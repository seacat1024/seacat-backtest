export type IndicatorLibraryItem = {
  id: string
  label: string
  desc: string
  kind: 'main' | 'sub'
}

export type MultiLineConfig = {
  id: number
  length: number
  color: string
  width: number
}

export type IndicatorCenterState = {
  selectedIds: string[]
  maLines: MultiLineConfig[]
  emaLines: MultiLineConfig[]
}
