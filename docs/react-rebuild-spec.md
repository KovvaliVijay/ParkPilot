# ParkPilot AI — React + Tailwind + FastAPI Rebuild Spec

This supersedes `design.md` as the build spec. `design.md` is still the
source of truth for *what each animation should feel like* (durations,
easing, which elements pulse/glow/stagger) — this file translates that
intent into a real React architecture and adds the piece design.md
didn't cover: a FastAPI backend contract so React has something real to
call instead of Streamlit's in-process Python.

Give the coding agent **both files**. Do not let it discard `design.md`
— when a component spec below says "see design.md §3.4," it means read
that section for exact keyframe/timing values.

---

## 0. What's changing and why

| Old (Streamlit) | New | Reason |
|---|---|---|
| `st.date_input` / `st.selectbox` (BaseWeb, uncontrollable dark-mode theming) | Fully custom `<DatePicker>` / `<TimeSelect>` built from scratch in React + Tailwind | Eliminates the dark-mode bug at the root — there is no third-party widget left to fight |
| Whole-page rerun on every interaction | React state + TanStack Query, only the changed subtree re-renders | Enables *real* diff-based animation (a spot only "drives in" when it actually just became occupied, not on every render) |
| Inline CSS strings in Python | Tailwind + a small set of custom keyframes in `tailwind.config.js` / `index.css` | Maintainable, themeable via CSS variables + Tailwind `dark:` variant |
| `folium` → static iframe map | `react-leaflet` | Real interactive map component, same dark/light tile logic |
| `matplotlib` → base64 PNG | `recharts` line chart | Crisp, animatable, no image regeneration round-trip |
| Model runs in-process in the Streamlit script | FastAPI service wrapping the **unchanged** `PredictOnUserInput` class | Frontend/backend separation; `predict_pipeline.py` logic is not touched |

---

## 1. Repo layout

```
parkpilot/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI app, CORS, routes
│   │   ├── schemas.py           # Pydantic models
│   │   ├── services/
│   │   │   └── forecast_service.py   # thin wrapper around existing pipeline
│   │   └── src/                 # <-- copy the EXISTING src/ package here unchanged
│   │       ├── pipeline/predict_pipeline.py
│   │       ├── exception.py
│   │       └── utils.py
│   ├── artifacts/               # <-- copy the EXISTING artifacts/ folder unchanged
│   └── requirements.txt
└── frontend/
    ├── src/
    │   ├── main.tsx
    │   ├── App.tsx
    │   ├── api/
    │   │   ├── client.ts         # fetch wrapper
    │   │   └── queries.ts        # TanStack Query hooks
    │   ├── store/
    │   │   └── useAppStore.ts    # Zustand: theme, selectedDate/time/lot, results
    │   ├── hooks/
    │   │   └── useCountUp.ts
    │   ├── components/
    │   │   ├── layout/Sidebar.tsx
    │   │   ├── layout/Hero.tsx
    │   │   ├── layout/TopBar.tsx
    │   │   ├── controls/DatePicker.tsx
    │   │   ├── controls/TimeSelect.tsx
    │   │   ├── controls/LotSlider.tsx
    │   │   ├── controls/RunScanButton.tsx
    │   │   ├── controls/ThemeToggle.tsx
    │   │   ├── kpi/KpiCard.tsx
    │   │   ├── kpi/KpiRow.tsx
    │   │   ├── lot/ParkingLotGrid.tsx
    │   │   ├── lot/Spot.tsx
    │   │   ├── lot/Car.tsx
    │   │   ├── forecast/ForecastRadar.tsx
    │   │   ├── forecast/ForecastCard.tsx
    │   │   ├── alerts/AlertBanner.tsx
    │   │   ├── map/CampusMap.tsx
    │   │   ├── chart/LotChart.tsx
    │   │   └── shared/Skeleton.tsx
    │   ├── styles/index.css
    │   └── types/index.ts
    ├── tailwind.config.ts
    ├── vite.config.ts
    └── package.json
```

---

## 2. Backend — FastAPI (wraps existing code, does not modify it)

### 2.1 Install

```
fastapi
uvicorn[standard]
pandas
numpy
scikit-learn
xgboost
python-multipart
```

### 2.2 `schemas.py`

```python
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
```

### 2.3 `services/forecast_service.py`

Reuses `PredictOnUserInput` and `parking_lot_html`'s seeded-occupancy
logic exactly as-is (same RNG seed formula) so spot layout is
deterministic and matches the old app's visual behavior:

```python
import numpy as np
import pandas as pd
from src.pipeline.predict_pipeline import PredictOnUserInput

def compute_occupied_spots(availability: float, selected_id: int, total=45) -> list[int]:
    rng = np.random.default_rng(42 + int(selected_id))
    occupied_count = int(round((1 - availability / 100) * total))
    occupied = rng.choice(np.arange(total), size=max(0, min(total, occupied_count)), replace=False)
    return sorted(int(x) for x in occupied)

def availability_level(value: float) -> str:
    if value >= 60: return "Easy"
    if value >= 30: return "Moderate"
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
```

### 2.4 `main.py`

```python
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
from .schemas import ForecastRequest, ForecastResponse, LotMeta
from .services.forecast_service import run_forecast

app = FastAPI(title="ParkPilot AI API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Vite dev server
    allow_methods=["*"], allow_headers=["*"],
)

df_lat_long = pd.read_csv("artifacts/df_ps_lat_long.csv")

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
```

Run with: `uvicorn app.main:app --reload --port 8000`

---

## 3. Frontend setup

```
npm create vite@latest frontend -- --template react-ts
cd frontend
npm i @tanstack/react-query zustand framer-motion react-leaflet leaflet recharts clsx
npm i -D tailwindcss postcss autoprefixer @types/leaflet
npx tailwindcss init -p
```

### 3.1 `tailwind.config.ts` — design tokens from design.md §2, as Tailwind theme

```ts
import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        bg: 'var(--theme-bg)',
        panel: 'var(--theme-panel)',
        panel2: 'var(--theme-panel2)',
        line: 'var(--theme-line)',
        ink: 'var(--theme-text)',
        muted: 'var(--theme-muted)',
        cyan: '#5ee7ff',
        green: '#58e391',
        yellow: '#ffd166',
        red: '#ff647c',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        display: ['"Space Grotesk"', 'sans-serif'],
      },
      transitionTimingFunction: {
        premium: 'cubic-bezier(.16,1,.3,1)',
      },
      keyframes: {
        ping2: { '0%': { transform: 'scale(.6)', opacity: '.8' }, '100%': { transform: 'scale(2.2)', opacity: '0' } },
        sheen: { '0%,60%': { transform: 'translateX(-120%)' }, '100%': { transform: 'translateX(120%)' } },
        idleGlow: { '0%,100%': { boxShadow: '0 10px 30px rgba(94,231,255,.15)' }, '50%': { boxShadow: '0 10px 40px rgba(94,231,255,.35)' } },
        freeBreathe: { '0%,100%': { boxShadow: 'inset 0 0 0 1px rgba(53,216,121,.16), 0 0 8px rgba(53,216,121,.10)' }, '50%': { boxShadow: 'inset 0 0 0 1px rgba(53,216,121,.35), 0 0 22px rgba(53,216,121,.22)' } },
        headlight: { '0%,100%': { boxShadow: '0 0 4px 1px rgba(191,247,255,.5)' }, '50%': { boxShadow: '0 0 9px 3px rgba(191,247,255,.9)' } },
        idleBob: { from: { transform: 'translateY(1px)' }, to: { transform: 'translateY(-1.5px)' } },
        floatIdle: { from: { transform: 'translateY(0)' }, to: { transform: 'translateY(-5px)' } },
        tightPulse: { '0%,100%': { borderColor: 'var(--theme-line)' }, '50%': { borderColor: '#ff647c', boxShadow: '0 0 16px rgba(255,100,124,.25)' } },
        rippleAnim: { to: { transform: 'scale(18)', opacity: '0' } },
      },
      animation: {
        ping2: 'ping2 1.8s var(--tw-ease,cubic-bezier(.16,1,.3,1)) infinite',
        sheen: 'sheen 3.2s ease-in-out infinite',
        idleGlow: 'idleGlow 2.6s ease-in-out infinite',
        freeBreathe: 'freeBreathe 2.4s ease-in-out infinite',
        headlight: 'headlight 1.6s ease-in-out infinite',
        idleBob: 'idleBob 2.8s ease-in-out infinite alternate',
        floatIdle: 'floatIdle 4.5s ease-in-out infinite alternate',
        tightPulse: 'tightPulse 2s ease-in-out infinite',
      },
    },
  },
  plugins: [],
} satisfies Config
```

### 3.2 `src/styles/index.css` — theme variables (both modes defined; `.dark` class toggles which set wins)

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Space+Grotesk:wght@500;600;700&display=swap');

:root {
  --theme-bg:#f3f7fb; --theme-panel:#ffffff; --theme-panel2:#eef4fa;
  --theme-line:#d4deea; --theme-text:#152033; --theme-muted:#536176;
}
.dark {
  --theme-bg:#070b12; --theme-panel:#101722; --theme-panel2:#151e2c;
  --theme-line:#283548; --theme-text:#f5f7fb; --theme-muted:#aeb9c9;
}

body { background: var(--theme-bg); color: var(--theme-text); transition: background-color .4s cubic-bezier(.16,1,.3,1), color .4s cubic-bezier(.16,1,.3,1); }

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { animation-duration: .001ms !important; transition-duration: .001ms !important; }
}
```

Because there are **no native browser/BaseWeb widgets left** (the date
picker and time select are hand-built React components styled entirely
with Tailwind + these CSS variables), the dark-mode input bug is
structurally impossible to reintroduce — there's no third-party
component whose internal styling you don't control.

---

## 4. State & data flow

### 4.1 `store/useAppStore.ts` (Zustand)

```ts
import { create } from 'zustand'
import type { ForecastResponse } from '../types'

interface AppState {
  theme: 'dark' | 'light'
  toggleTheme: () => void
  selectedDate: string
  selectedTime: string
  selectedLot: number
  setSelectedDate: (v: string) => void
  setSelectedTime: (v: string) => void
  setSelectedLot: (v: number) => void
  result: ForecastResponse | null
  previousOccupied: number[]     // <-- enables real diff-based car animation
  setResult: (r: ForecastResponse) => void
}

export const useAppStore = create<AppState>((set, get) => ({
  theme: 'dark',
  toggleTheme: () => set(s => ({ theme: s.theme === 'dark' ? 'light' : 'dark' })),
  selectedDate: '2016-12-19',
  selectedTime: '08:00',
  selectedLot: 1,
  setSelectedDate: v => set({ selectedDate: v }),
  setSelectedTime: v => set({ selectedTime: v }),
  setSelectedLot: v => set({ selectedLot: v }),
  result: null,
  previousOccupied: [],
  setResult: r => set(s => ({ result: r, previousOccupied: s.result?.occupied_spots ?? [] })),
}))
```

`toggleTheme` should also toggle the `dark` class on `document.documentElement`
in a `useEffect` in `App.tsx` — this is the entire theming mechanism, no
BaseWeb-style workarounds needed.

### 4.2 `api/queries.ts` (TanStack Query)

```ts
import { useMutation, useQuery } from '@tanstack/react-query'
import { useAppStore } from '../store/useAppStore'
import type { ForecastResponse, LotMeta } from '../types'

const BASE = 'http://localhost:8000'

export function useLots() {
  return useQuery<LotMeta[]>({
    queryKey: ['lots'],
    queryFn: () => fetch(`${BASE}/api/lots`).then(r => r.json()),
  })
}

export function useRunScan() {
  const setResult = useAppStore(s => s.setResult)
  return useMutation({
    mutationFn: async (payload: { date: string; time: string; selected_lot: number }) => {
      const res = await fetch(`${BASE}/api/forecast`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error(await res.text())
      return (await res.json()) as ForecastResponse
    },
    onSuccess: setResult,
  })
}
```

`useRunScan().isPending` drives the loading/skeleton state described in
design.md §0/§3 (item 1: "loading/scan state") — no `st.spinner`
equivalent needed; render `<Skeleton>` variants while `isPending`.

---

## 5. Components — precise spec

For every component: **cross-reference the matching `design.md` section
in parentheses** for exact motion values. Implement with Framer Motion
(`initial`/`animate`/`variants`/`transition`), not raw CSS keyframes,
*except* for continuous ambient loops (breathing glow, headlight pulse,
idle float) which stay as Tailwind `animate-*` utilities from §3.1 —
Framer Motion is for one-shot mount/state-change transitions, Tailwind
keyframes are for infinite ambient loops. Don't mix the two for the same
property on the same element.

### 5.1 `ThemeToggle.tsx` (design.md §3.9, but now trivial)
Simple switch bound to `useAppStore().theme`; toggling flips the `dark`
class on `<html>`. No portal, no BaseWeb, no bug surface.

### 5.2 `DatePicker.tsx` — fully custom, replaces `st.date_input`
- A Tailwind-styled `<button>` showing the selected date, opening a
  small custom calendar `<div>` positioned with a `ref` (no portal
  needed — render it inline with `position:absolute` inside a
  `relative` parent, so it always inherits the page's CSS variables;
  this is *why* the bug can't recur).
- Constrain to the model's supported range: `2016-12-13` to
  `2016-12-19` (from `app.py`'s `min_value`/`max_value`) — disable dates
  outside this range in the grid.
- Framer Motion `AnimatePresence` for open/close (scale+fade, 150ms).

### 5.3 `TimeSelect.tsx` — fully custom, replaces `st.selectbox`
- Options generated exactly as before:
  `["08:00","08:30",...,"16:30"]` (hours 8–16, minutes 00/30).
- Custom dropdown list, Tailwind `dark:` classes, Framer Motion open
  animation matching the date picker.

### 5.4 `LotSlider.tsx`
- Native `<input type="range" min=1 max=27>` restyled with Tailwind
  (`accent-color` utility or custom thumb via `::-webkit-slider-thumb`
  in `index.css`) — range inputs style reliably across themes, no
  BaseWeb dependency, keep this one simple.

### 5.5 `RunScanButton.tsx` (design.md §3.2)
- Tailwind `animate-idleGlow` for the idle pulse.
- Framer Motion `whileTap={{ scale: 0.97 }}`.
- Click ripple: small local React state (`ripples: {x,y,id}[]`) — on
  click, push a ripple, render an absolutely-positioned `motion.span`
  with a scale+fade-out animation, remove from state `onAnimationComplete`.
  This replaces the raw-JS `addEventListener` hack from design.md (React
  can do this natively and more reliably).
- Shows a spinner label ("Scanning…") while `useRunScan().isPending`.

### 5.6 `KpiCard.tsx` (design.md §3.3)
- Framer Motion stagger: parent `<KpiRow>` uses a `variants` container
  with `staggerChildren: 0.06`; each `<KpiCard>` is a child variant
  (fade + translateY, matches `cardIn` keyframe timing/easing).
- `useCountUp(target, duration=700)` hook (see below) drives the big
  number; re-triggers whenever `target` changes (new scan result).
- Hover: Tailwind `hover:-translate-y-1 hover:border-slate-600 transition`.

```ts
// hooks/useCountUp.ts
import { useEffect, useState, useRef } from 'react'

export function useCountUp(target: number, duration = 700) {
  const [value, setValue] = useState(0)
  const raf = useRef<number>()
  useEffect(() => {
    const start = performance.now()
    const from = value
    function tick(now: number) {
      const p = Math.min(1, (now - start) / duration)
      const eased = 1 - Math.pow(1 - p, 3)
      setValue(from + (target - from) * eased)
      if (p < 1) raf.current = requestAnimationFrame(tick)
    }
    raf.current = requestAnimationFrame(tick)
    return () => raf.current && cancelAnimationFrame(raf.current)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target])
  return value
}
```

### 5.7 `ParkingLotGrid.tsx` + `Spot.tsx` + `Car.tsx` (design.md §3.4 — now upgraded)

This is the one place the React rebuild is strictly better than what
design.md specified, because design.md's §3.4 was written around
Streamlit's constraint of "every render is a full HTML replace, so we
fake staggered entrance every time." **React doesn't have that
constraint** — use it properly:

- `ParkingLotGrid` renders 45 `<Spot index occupied />` in a
  `grid-cols-9 gap-2` container, with a `<div className="col-span-9 border-dashed ...">`
  road divider after indices 8/17/26/35 (same as original).
- On **first mount** (or first successful scan), animate all 45 spots in
  with Framer Motion `staggerChildren` (§3.4's `spotIn`/stagger values).
- On **subsequent scans**, diff `result.occupied_spots` against
  `previousOccupied` from the store:
  - A spot newly present in `occupied_spots` → render `<Car arriving />`,
    which plays the `driveIn` variant (translateX -140%→0, matches
    design.md keyframe) *only for that spot*.
  - A spot that was occupied and is now empty → play a quick fade/scale
    "car leaves" exit variant (`AnimatePresence` `exit`), rather than
    just popping away.
  - Spots unchanged between scans → no re-animation, they simply stay
    as they are (this is the real payoff of moving to React: no more
    "everything re-plays its entrance on every render").
- Ambient loops (idle bob, headlight pulse, empty-spot breathing glow)
  stay as Tailwind `animate-idleBob` / `animate-headlight` /
  `animate-freeBreathe` applied unconditionally based on `occupied`
  boolean — these run continuously regardless of diffing.
- Hover tooltip: Tailwind `group` / `group-hover:opacity-100` on a small
  absolutely-positioned label showing `Spot {n} · {Free|Occupied}`.

### 5.8 `ForecastRadar.tsx` + `ForecastCard.tsx` (design.md §3.5)
- 5 cards from `result.checkpoints`, staggered like KPI cards.
- Bar fill: Framer Motion `animate={{ width: `${value}%` }}` from
  `width: 0`, `transition={{ duration: .7, ease: [.16,1,.3,1], delay: .3 }}`
  — no need for the CSS-variable trick from design.md, Framer Motion
  animates the numeric width directly.
- `checkpoint.is_tight` → apply `animate-tightPulse` Tailwind class.

### 5.9 `AlertBanner.tsx` (design.md §3.6)
- Framer Motion slide-in with slight overshoot: use a `type: 'spring'`
  transition (`stiffness: 300, damping: 20`) instead of manually crafted
  keyframe percentages — this is the idiomatic Framer Motion way to get
  the "70% overshoot then settle" feel design.md describes.
- Icon: Tailwind `animate-pulse` (built-in) or a custom 1.8s scale pulse
  if more emphasis is wanted.
- Color/border driven by `result.alert_level` (`good`/`warn`/`bad`).

### 5.10 `CampusMap.tsx`
- `react-leaflet` `<MapContainer>` with tile layer swapped by theme:
  CartoDB dark tiles in dark mode, standard OSM in light mode (same
  logic as `create_prediction_map`'s `tiles=` argument).
- `<CircleMarker>` per lot from `result.all_lots`, radius scaled by
  availability (`6 + availability**0.6`, same formula as the Python
  version), color from a client-side red→yellow→green scale function
  (replicate `RdYlGn` at 0/50/100 stops — a simple `d3-scale-chromatic`
  import or a 3-stop manual interpolation is fine).
- Wrap in a `<motion.div>` matching the KPI card entrance (fade+scale).

### 5.11 `LotChart.tsx`
- `recharts` `<LineChart>` with two `<Line>`s: solid for
  `historical_series`, dashed (`strokeDasharray="6 4"`) for
  `forecast_series`, matching the matplotlib version's legend/labels.
- Entrance: wrap the chart in a `<motion.div>` with a clip-path reveal
  (`initial={{ clipPath: 'inset(0 100% 0 0)' }}`, animate to
  `inset(0 0 0 0)`, 900ms, matches design.md §3.7's `chartReveal`).

### 5.12 `Skeleton.tsx`
- Shimmer skeletons for KPI cards, forecast cards, and the lot grid,
  shown while `useRunScan().isPending` (design.md §0 item 1 / §1 loading
  state). Simple Tailwind `animate-pulse` on gray blocks is sufficient;
  a diagonal shimmer sweep (like `.logo::after` in design.md §3.1) is a
  nice-to-have if time allows.

---

## 6. Build order for the agent

1. Scaffold `backend/` — copy `src/` and `artifacts/` unchanged, write
   `schemas.py`, `services/forecast_service.py`, `main.py` from §2.
   Verify `POST /api/forecast` returns correct JSON via `curl` before
   touching the frontend at all.
2. Scaffold `frontend/` with Vite, install deps, wire `tailwind.config.ts`
   and `index.css` from §3.
3. Build `useAppStore`, `api/queries.ts`, and `types/index.ts` (mirror
   the Pydantic schemas as TS interfaces).
4. Build the sidebar controls (§5.1–5.5) — get theme toggling and the
   custom date/time pickers working and visually correct in both themes
   *before* wiring any API calls. Confirm the dark-mode bug cannot occur
   here (no BaseWeb/native popovers exist).
5. Wire `RunScanButton` to `useRunScan()`, build `Skeleton` loading
   states.
6. Build `KpiRow`/`KpiCard` with count-up + stagger.
7. Build `ParkingLotGrid`/`Spot`/`Car` with the diff-based animation
   logic (§5.7) — this is the highest-effort component, budget the most
   time here.
8. Build `ForecastRadar`, `AlertBanner`.
9. Build `CampusMap`, `LotChart`.
10. Assemble `App.tsx` layout (hero, sidebar, main content), pre-scan
    empty state (design.md §3.8 step cards + demo grid using a fixed
    demo `occupied_spots` array from `/api/lots` + a hardcoded 58%
    availability, no API call needed for this state).
11. Full pass against the acceptance checklist below.

---

## 7. Acceptance criteria

- [ ] No native browser or third-party popover/dropdown exists anywhere
      in the app — date and time selection are fully custom components,
      so there is no widget left that can regress into unthemed light
      styling.
- [ ] Toggling dark/light transitions smoothly (`body`/`--theme-*` vars
      transition over ~400ms), including the date/time controls.
- [ ] Running a scan shows skeleton states, not a blank gap, while the
      request is in flight.
- [ ] KPI numbers count up on every new result, not just the first.
- [ ] Running two scans in a row where only *some* spots change
      occupancy animates **only those spots** (drive-in / drive-out) —
      unchanged spots do not replay their entrance. This is verifiable
      by comparing `occupied_spots` between two consecutive
      `ForecastResponse`s and watching the grid.
- [ ] Forecast bars fill from 0 on each new result; checkpoints under
      25% availability show the tight-pulse border.
- [ ] The alert banner spring-animates in and its color/message match
      `alert_level`/`alert_message` from the API.
- [ ] Map markers are colored/sized by availability and use dark tiles
      in dark mode.
- [ ] The chart's historical line is solid, forecast line is dashed, and
      it reveals via clip-path on mount.
- [ ] With OS "reduce motion" enabled, all animation becomes instant —
      verified via the `prefers-reduced-motion` CSS block in §3.2 and by
      checking Framer Motion respects `useReducedMotion()` (wrap
      transitions accordingly where Framer Motion is used).
