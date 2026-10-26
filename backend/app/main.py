import sys
import os

# Add app/ directory to sys.path so the UNCHANGED pipeline code's
# `from src.exception import ...` and `from src.utils import ...` resolve correctly.
# This avoids modifying predict_pipeline.py.
sys.path.insert(0, os.path.join(os.path.dirname(__file__)))

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
from app.schemas import ForecastRequest, ForecastResponse, LotMeta
from app.services.forecast_service import run_forecast

app = FastAPI(title="ParkPilot AI API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],  # Vite dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

_possible_paths = [
    os.path.join(os.path.dirname(os.path.dirname(__file__)), "artifacts", "df_ps_lat_long.csv"),
    "artifacts/df_ps_lat_long.csv",
    "../artifacts/df_ps_lat_long.csv",
]
_df_path = next((p for p in _possible_paths if os.path.exists(p)), "artifacts/df_ps_lat_long.csv")
df_lat_long = pd.read_csv(_df_path)


@app.get("/api/lots", response_model=list[LotMeta])
def get_lots():
    return [
        {"ps_idx": int(r.ps_idx), "latitude": r.Latitude, "longitude": r.Longitude, "capacity": int(r.Capacity)}
        for r in df_lat_long.itertuples()
    ]


@app.post("/api/forecast", response_model=ForecastResponse)
def post_forecast(req: ForecastRequest):
    try:
        return run_forecast(req.date, req.time, req.selected_lot, df_lat_long)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/health")
def health():
    return {"status": "ok"}
