// TypeScript interfaces mirroring backend Pydantic schemas (react-rebuild-spec.md §2.2)

export interface SeriesPoint {
  timestamp: string
  value: number
}

export interface LotResult {
  ps_idx: number
  latitude: number
  longitude: number
  capacity: number
  availability: number
}

export interface ForecastCheckpoint {
  label: string
  occupancy_pct: number
  is_tight: boolean
}

export interface ForecastResponse {
  selected_lot: number
  selected_availability: number
  availability_level: 'Easy' | 'Moderate' | 'Tight'
  avg_availability: number
  best_lot: LotResult
  worst_lot: LotResult
  all_lots: LotResult[]
  checkpoints: ForecastCheckpoint[]
  historical_series: SeriesPoint[]
  forecast_series: SeriesPoint[]
  occupied_spots: number[]
  alert_level: 'good' | 'warn' | 'bad'
  alert_message: string
}

export interface LotMeta {
  ps_idx: number
  latitude: number
  longitude: number
  capacity: number
}

export interface ForecastRequest {
  date: string
  time: string
  selected_lot: number
}
