# 🛰 TerraVeil — 24-Hour Hackathon Workflow
**HackX 4.0 · COSMEON PS-06 · 2 Persons**

---

## 🌿 Branch Strategy

```
main                  ← stable, merge here only
├── backend/feature-* ← Person A branches
└── frontend/feature-* ← Person B branches
```

**Branch naming:**
```bash
git checkout -b backend/satellite-ingestion    # Person A example
git checkout -b frontend/dashboard-ui          # Person B example
```

**Sync rule:** Both persons push their branch → open PR → merge to `main` at Hours 8, 16, 20, 23.

---

## 👤 PERSON A — Backend · Pipeline · Intelligence
**Branch prefix:** `backend/`

### Setup (Hour 0–1)
- [ ] Copy `.env.example` → `.env`, fill in GEE credentials
- [ ] `cd backend && python -m venv .venv && source .venv/bin/activate`
- [ ] `pip install -r requirements.txt`
- [ ] Authenticate GEE: `earthengine authenticate` or service account key
- [ ] Run `python scripts/verify_cache.py` to confirm env works
- [ ] **Commit:** `git commit -m "chore: backend env + deps verified"`

### Hour 1–4 · `backend/db-schema`
**File:** `backend/app/db/database.py`
- [ ] Create SQLite DB connection (aiosqlite) + `init_db()` function
- [ ] Create all 3 tables: `scans`, `pipeline_logs`, `orbital_nodes`
- [ ] Write helper functions: `create_scan()`, `log_step()`, `complete_log_step()`, `get_scan()`, `get_logs()`

**File:** `backend/app/models/schemas.py`
- [ ] Pydantic models: `ScanRequest`, `InferencePacket`, `RiskInsightObject`, `PipelineLogRow`
- [ ] **Commit + merge to main**

### Hour 4–8 · `backend/satellite-ingestion`
**File:** `backend/app/pipeline/satellite_ingestion.py`
- [ ] GEE init with service account or token
- [ ] `fetch_sentinel2(bbox, t0, t1)` → median composite, cloud mask < 20%
- [ ] `fetch_sentinel1(bbox, t0, t1)` → VV/VH GRD
- [ ] Fallback: load pre-cached GeoTIFF if GEE unavailable
- [ ] Export rasters to `backend/static/geotiffs/`

**File:** `backend/app/pipeline/ndwi.py`
- [ ] `compute_ndwi(sentinel2_img)` → NDWI raster, flood mask, flood_area_km2

**File:** `backend/app/pipeline/nddi.py`
- [ ] `compute_nddi(sentinel2_img)` → NDDI raster, drought severity tier, drought_area_km2

**File:** `backend/app/pipeline/sar.py`
- [ ] `compute_sar_flood(sentinel1_img)` → Otsu threshold, SAR water mask

**File:** `backend/app/pipeline/change_detection.py`
- [ ] `detect_change(ndwi_t0, ndwi_t1)` → delta raster, binary change mask (delta > 0.2)
- [ ] **Commit + merge to main**

### Hour 8–12 · `backend/orbital-nodes`
**File:** `backend/app/orbital/node.py`
- [ ] `class OrbitalNode` — init with `node_id`, `tile_bbox`
- [ ] `async def process(imagery) -> InferencePacket` — runs NDWI, times compute_ms, calculates bandwidth_ratio
- [ ] Simulate 800ms compute budget; graceful fail returns `None`

**File:** `backend/app/orbital/inference_packet.py`
- [ ] `@dataclass InferencePacket` — fields: `node_id`, `bbox`, `flood_area_km2`, `confidence`, `ndwi_mean`, `bandwidth_ratio`, `compute_ms`, `status`

**File:** `backend/app/orbital/consensus.py`
- [ ] `run_consensus(packets: list[InferencePacket]) -> RiskInsightObject`
- [ ] Bayesian confidence: 3/3→0.97, 2/3→0.87, 1/3→uncertain
- [ ] Consensus flood_area = weighted mean by confidence
- [ ] Confidence interval = ±(std_dev × 1.5)
- [ ] Sets `reduced_confidence=True` if < 3 nodes

**File:** `backend/app/pipeline/infrastructure.py`
- [ ] `fetch_infrastructure(bbox)` via OSMnx — hospitals, schools, bridges, roads, water treatment
- [ ] `intersect_with_flood(infra, flood_mask)` → list of `{type, name, coords, risk_level}`
- [ ] **Commit + merge to main**

### Hour 12–16 · `backend/risk-pipeline`
**File:** `backend/app/pipeline/risk_classifier.py`
- [ ] `classify_risk(flood_area_km2, confidence, pop_affected, ndwi_mean) -> {risk_level, risk_score}`
- [ ] Risk tiers: LOW(<20)/MEDIUM(20-50)/HIGH(50-75)/CRITICAL(>75)
- [ ] Score: composite 0–100

**File:** `backend/app/pipeline/forecast.py`
- [ ] `fetch_openmeteo_forecast(lat, lon)` → 72h precipitation forecast (no API key)
- [ ] `compute_forecast_score(ndwi_trend, rainfall_72h, elevation)` → score 0–100
- [ ] Weights: 35% NDWI trend + 35% rainfall + 30% elevation
- [ ] `forecast_recommendation(score)` → string recommendation

**File:** `backend/app/pipeline/runner.py`
- [ ] `async def run_pipeline(scan_id, region, bbox, t0, t1, source)`
- [ ] Orchestrates all 8 steps, logs every step start+end to SQLite
- [ ] Steps in order: SATELLITE_INGESTION → NDWI_COMPUTATION → SAR_ANALYSIS → CHANGE_DETECTION → OEC_INFERENCE → CONSENSUS → INFRASTRUCTURE_OVERLAY → RISK_CLASSIFICATION → FORECAST_72H → REPORT_GENERATION
- [ ] Updates `scans.status` throughout
- [ ] **Commit + merge to main**

### Hour 16–20 · `backend/api-endpoints` ⚠️ PRE-CACHE DEADLINE
**File:** `backend/app/main.py`
- [ ] FastAPI app, CORS, router registration, lifespan (init_db on startup)

**File:** `backend/app/api/routes/scan.py`
- [ ] `POST /api/v1/scan` — accepts `ScanRequest`, triggers `run_pipeline` async (background task), returns `scan_id`
- [ ] `GET /api/v1/scans/{id}` — returns full scan result from SQLite

**File:** `backend/app/api/routes/risk.py`
- [ ] `GET /api/v1/risk?region=kolhapur&date=2021-07-22` — shorthand; reads from SQLite cache

**File:** `backend/app/api/routes/logs.py`
- [ ] `GET /api/v1/scans/{id}/logs` — returns all `pipeline_logs` rows for scan

**File:** `backend/app/api/routes/nodes.py`
- [ ] `GET /api/v1/nodes/{scan_id}` — returns all `orbital_nodes` rows for scan

**File:** `backend/app/api/routes/history.py`
- [ ] `GET /api/v1/history` — returns last 20 scans from SQLite

**🚨 PRE-CACHE RUNS:**
- [ ] `python scripts/precache_regions.py` for Kolhapur Jul 2021
- [ ] `python scripts/precache_regions.py` for Pakistan Aug 2022
- [ ] `python scripts/precache_regions.py` for Chennai Nov 2021
- [ ] Verify: `python scripts/verify_cache.py` → all 3 show `status: completed`
- [ ] **Commit + merge to main**

### Hour 20–23 · `backend/polish`
- [ ] `uvicorn app.main:app --reload` — full smoke test of all endpoints
- [ ] `curl 'http://localhost:8000/api/v1/risk?region=kolhapur&date=2021-07-22'` → must return JSON
- [ ] Fix any 500 errors
- [ ] Write `backend/tests/test_api.py` — at least 3 happy-path tests
- [ ] Record 60-second screen fallback video
- [ ] **Final commit + merge to main**

---

## 👤 PERSON B — Frontend · UI · Demo
**Branch prefix:** `frontend/`

### Setup (Hour 0–1)
- [ ] `cd frontend && npm create vite@latest . -- --template react`
- [ ] `npm install leaflet react-leaflet axios react-router-dom`
- [ ] Remove Vite boilerplate from `App.jsx` and `index.css`
- [ ] Add Google Fonts (Inter) to `index.html`
- [ ] Confirm `npm run dev` loads on `localhost:5173`
- [ ] **Commit:** `git commit -m "chore: frontend vite scaffold"`

### Hour 1–4 · `frontend/design-system`
**File:** `frontend/src/styles/variables.css`
```css
:root {
  --color-bg: #060b14;
  --color-surface: #0d1526;
  --color-border: #1a2a45;
  --color-accent: #00d4ff;
  --color-accent2: #7c3aed;
  --color-success: #22c55e;
  --color-warning: #f59e0b;
  --color-danger: #ef4444;
  --color-critical: #dc2626;
  --font-primary: 'Inter', sans-serif;
  --radius: 12px;
  --shadow: 0 4px 24px rgba(0,212,255,0.08);
}
```
- [ ] Design system: dark background, glassmorphism cards, accent cyan/purple
- [ ] Global resets, typography scale, card/badge/button base styles
- [ ] **Commit**

**File:** `frontend/src/services/api.js`
- [ ] `axios` instance pointing to `http://localhost:8000`
- [ ] `getScanResult(id)`, `submitScan(payload)`, `getLogs(id)`, `getNodes(id)`, `getHistory()`, `getRisk(region, date)`

### Hour 4–8 · `frontend/orbital-intro`
**File:** `frontend/src/components/animation/OrbitalIntro.jsx`
- [ ] 8-second CSS animation sequence:
  - 0s: satellite dot orbiting SVG India map (CSS keyframes `@keyframes orbit`)
  - 2s: beam line sweeps from top → Kolhapur dot
  - 4s: text "⚡ Anomaly Detected" fades in
  - 5s: three node cards pulse green
  - 7s: text "📡 Intelligence Transmitted"
  - 8s: transition out → dashboard appears
- [ ] SVG India map (simple path, not a library)
- [ ] Triggered on app load; skip button in top-right corner
- [ ] Pure React + CSS keyframes, zero new libraries
- [ ] **Commit + merge to main**

### Hour 8–12 · `frontend/dashboard-core`
**File:** `frontend/src/components/dashboard/Dashboard.jsx`
- [ ] Layout: top navbar + left map panel (60%) + right info panel (40%)
- [ ] Scan submission form: bbox presets (Kolhapur / Chennai / Pakistan) + date pickers + Submit button

**File:** `frontend/src/components/dashboard/RiskCard.jsx`
- [ ] Risk level badge (color-coded: LOW=green, MEDIUM=amber, HIGH=orange, CRITICAL=red pulsing)
- [ ] Risk score 0–100 circular gauge (CSS conic-gradient)
- [ ] Confidence band display: `0.91 [0.87 – 0.95]`

**File:** `frontend/src/components/dashboard/StatsBar.jsx`
- [ ] Stat chips: flood_area_km2 | pop_affected | hospitals_at_risk | roads_km_affected

**File:** `frontend/src/components/dashboard/BandwidthCounter.jsx`
- [ ] Animated counter: "2,300 MB raw → 6.2 KB packet — 380,000:1 reduction"
- [ ] Numbers count up with CSS animation on mount
- [ ] **Commit + merge to main**

### Hour 12–16 · `frontend/map-nodes`
**File:** `frontend/src/components/map/MapPanel.jsx`
- [ ] Leaflet map, dark tiles (CartoDB dark matter)
- [ ] Center on analysis bbox on scan complete

**File:** `frontend/src/components/map/FloodOverlay.jsx`
- [ ] GeoJSON/raster overlay for flood heatmap (opacity gradient: blue → cyan → white)
- [ ] Drought zone overlay (orange gradient)
- [ ] Toggle between flood / drought / change detection views

**File:** `frontend/src/components/map/InfrastructureMarkers.jsx`
- [ ] Custom icons for: 🏥 hospital, 🏫 school, 🌉 bridge, 🚰 water treatment
- [ ] Red pulse ring on at-risk markers
- [ ] Tooltip with name + risk_level

**File:** `frontend/src/components/nodes/NodeCard.jsx`
- [ ] Card per OrbitalNode (COSMEON-LEO-07 / 11 / 14)
- [ ] Fields: node_id · status · confidence · compute_ms · bandwidth_ratio · flood_area_km2
- [ ] Green glow = active, grey = failed

**File:** `frontend/src/components/nodes/ConsensusResult.jsx`
- [ ] "Consensus: 3/3 nodes · Confidence 0.91 · Area 142.7 km²"
- [ ] Visual: 3 node icons → arrow → consensus badge
- [ ] **Commit + merge to main**

### Hour 16–20 · `frontend/live-data`
**File:** `frontend/src/hooks/useLogs.js`
- [ ] `useEffect` polling `GET /api/v1/scans/{id}/logs` every 800ms
- [ ] Stops polling when scan `status === 'completed'` or `'failed'`

**File:** `frontend/src/components/logs/LogPanel.jsx`
- [ ] Terminal-style dark panel (monospace font, dark bg)
- [ ] Each row: step icon + step_name + status badge + duration_ms + output_summary snippet
- [ ] Step icons: 🛰 SATELLITE · 🌊 NDWI · 📡 SAR · 🔄 CHANGE · 🤖 OEC · 🔗 CONSENSUS · 🏗 INFRA · ⚡ RISK · 📈 FORECAST
- [ ] Smooth scroll to latest entry

**File:** `frontend/src/components/forecast/ForecastToggle.jsx`
- [ ] 4-state tab bar: **Before** | **Now** | **72H Forecast** | **Drought Index**
- [ ] Each tab swaps: map overlay + risk card data + stats bar
- [ ] Forecast tab shows: forecast_score + forecast_rec + rainfall chart (simple SVG bars)

**File:** `frontend/src/hooks/useScans.js`
- [ ] `submitScan()` → POST → poll GET every 2s until status complete
- [ ] **Commit + merge to main**

### Hour 20–23 · `frontend/polish-demo`
- [ ] Scan history panel (sidebar) — replay any past scan from `GET /api/v1/history`
- [ ] Smooth page transitions (CSS fade)
- [ ] Mobile responsive check (min 768px)
- [ ] Loading skeleton screens while scan is running
- [ ] Confirm `curl` demo response renders correctly in dashboard
- [ ] End-to-end flow: submit Kolhapur → watch logs → see result on map → toggle 4-state
- [ ] **Final commit + merge to main**

---

## 🔗 Integration Sync Points

| Time | Action |
|------|--------|
| **Hour 0** | Agree on `RiskInsightObject` JSON schema — Person A writes it in `schemas.py`, Person B uses it in `api.js` |
| **Hour 8** | Merge both branches to `main`; Person B connects API calls to Person A's live server |
| **Hour 16** | Full end-to-end test: submit scan from UI → watch live logs → see result |
| **Hour 20** | ⚠️ PRE-CACHE COMPLETE. Both persons verify all 3 regions (`curl` test) |
| **Hour 22** | Dress rehearsal: full 2-minute demo script run-through |

---

## 🚀 Deployment (Hour 22+)

### Option A — Railway (Fastest, Recommended)
1. Push `main` to GitHub
2. Go to [railway.app](https://railway.app) → New Project → Deploy from GitHub
3. Add Backend service: root `./backend`, start command `uvicorn app.main:app --host 0.0.0.0 --port 8000`
4. Add Frontend service: root `./frontend`, build `npm run build`, serve `dist/`
5. Set environment variables from `.env.example`
6. Judge demo URL: `https://terraveil-backend.railway.app/api/v1/risk?region=kolhapur&date=2021-07-22`

### Option B — Render (Free)
1. Backend → New Web Service → Python → start command `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
2. Frontend → New Static Site → build `npm run build` → publish dir `dist`

### Local fallback (always ready)
```bash
# Terminal 1 — Backend
cd backend && source .venv/bin/activate && uvicorn app.main:app --reload --port 8000

# Terminal 2 — Frontend
cd frontend && npm run dev
```

---

## ⚠️ Critical Rules
1. **Hour 20 = hard stop** for pre-caching. No GEE calls during demo.
2. Demo reads **only from SQLite cache**.
3. Record 60s fallback screen video at Hour 22 (upload to Google Drive).
4. **Demo stability > features**. Freeze new work at Hour 20.
5. The `curl` command must work instantly: `curl 'http://localhost:8000/api/v1/risk?region=kolhapur&date=2021-07-22'`
