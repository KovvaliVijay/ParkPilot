import numpy as np
import pandas as pd
from src.pipeline.predict_pipeline import PredictOnUserInput


def compute_occupied_spots(availability: float, selected_id: int, total=45) -> list[int]:
    rng = np.random.default_rng(42 + int(selected_id))
    occupied_count = int(round((1 - availability / 100) * total))
    occupied = rng.choice(np.arange(total), size=max(0, min(total, occupied_count)), replace=False)
    return sorted(int(x) for x in occupied)


def availability_level(value: float) -> str:
    if value >= 60:
        return "Easy"
    if value >= 30:
        return "Moderate"
    return "Tight"


def alert_for(selected_avail: float, selected_lot: int, best_lot: int, best_avail: float, time_str: str):
    if selected_avail < 25:
        return "bad", f"Parking is tight. Lot {selected_lot} has only {selected_avail:.1f}% predicted availability at {time_str}."
    if selected_avail < 50:
        return "warn", f"Demand rising. Consider Lot {best_lot} with {best_avail:.1f}% predicted availability."
    return "good", f"Good parking window. Lot {selected_lot} is predicted to have {selected_avail:.1f}% availability."


def run_forecast(date: str, time: str, selected_lot: int, df_lat_long: pd.DataFrame) -> dict:
    predictor = PredictOnUserInput(date_inp=date, time_inp=time)
    fc = predictor.forcast_all_parkLots()   # unchanged pipeline call

    rows = []
    for ps_idx, item in fc.items():
        rows.append({"ps_idx": ps_idx, "availability": float(item["forecast"].iloc[-1])})
    avail_df = pd.DataFrame(rows).merge(df_lat_long, on="ps_idx", how="inner")

    selected_avail = float(avail_df.loc[avail_df.ps_idx == selected_lot, "availability"].iloc[0])
    avg_avail = float(avail_df.availability.mean())
    best = avail_df.sort_values("availability", ascending=False).iloc[0]
    worst = avail_df.sort_values("availability", ascending=True).iloc[0]

    series = pd.Series(100 - fc[selected_lot]["forecast"].values, index=fc[selected_lot]["forecast"].index)
    positions = np.linspace(0, len(series) - 1, min(5, len(series))).astype(int) if len(series) else []
    checkpoints = [{
        "label": series.index[p].strftime("%H:%M"),
        "occupancy_pct": float(series.iloc[p]),
        "is_tight": float(series.iloc[p]) > 75,  # occupancy > 75% == availability < 25%
    } for p in positions]

    hist = fc[selected_lot]["train"].iloc[-126:]
    pred = fc[selected_lot]["forecast"]

    alert_level, alert_message = alert_for(selected_avail, selected_lot, int(best.ps_idx), float(best.availability), time)

    return {
        "selected_lot": selected_lot,
        "selected_availability": round(selected_avail, 1),
        "availability_level": availability_level(selected_avail),
        "avg_availability": round(avg_avail, 1),
        "best_lot": {"ps_idx": int(best.ps_idx), "latitude": float(best.Latitude), "longitude": float(best.Longitude), "capacity": int(best.Capacity), "availability": round(float(best.availability), 1)},
        "worst_lot": {"ps_idx": int(worst.ps_idx), "latitude": float(worst.Latitude), "longitude": float(worst.Longitude), "capacity": int(worst.Capacity), "availability": round(float(worst.availability), 1)},
        "all_lots": [{"ps_idx": int(r.ps_idx), "latitude": float(r.Latitude), "longitude": float(r.Longitude), "capacity": int(r.Capacity), "availability": round(float(r.availability), 1)} for r in avail_df.itertuples()],
        "checkpoints": checkpoints,
        "historical_series": [{"timestamp": str(ts), "value": round(100 - v, 2)} for ts, v in hist.items()],
        "forecast_series": [{"timestamp": str(ts), "value": round(100 - v, 2)} for ts, v in pred.items()],
        "occupied_spots": compute_occupied_spots(selected_avail, selected_lot),
        "alert_level": alert_level,
        "alert_message": alert_message,
    }
