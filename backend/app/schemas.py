from pydantic import BaseModel
from typing import Optional


class ForecastRequest(BaseModel):
    date: str            # "2016-12-19"
    time: str            # "08:00"
    selected_lot: int    # 1..27


class SeriesPoint(BaseModel):
    timestamp: str
    value: float


class LotResult(BaseModel):
    ps_idx: int
    latitude: float
    longitude: float
    capacity: int
    availability: float          # last forecast step, as % available


class ForecastCheckpoint(BaseModel):
    label: str                   # "14:30"
    occupancy_pct: float
    is_tight: bool               # occupancy implies availability < 25%


class ForecastResponse(BaseModel):
    selected_lot: int
    selected_availability: float
    availability_level: str      # "Easy" | "Moderate" | "Tight"
    avg_availability: float
    best_lot: LotResult
    worst_lot: LotResult
    all_lots: list[LotResult]
    checkpoints: list[ForecastCheckpoint]
    historical_series: list[SeriesPoint]   # last 126 pts, availability %
    forecast_series: list[SeriesPoint]     # forecast horizon, availability %
    occupied_spots: list[int]              # 0-indexed, out of 45, deterministic
    alert_level: str              # "good" | "warn" | "bad"
    alert_message: str


class LotMeta(BaseModel):
    ps_idx: int
    latitude: float
    longitude: float
    capacity: int
