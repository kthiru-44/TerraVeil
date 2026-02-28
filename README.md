<div align="center">

# 🛰️ TERRAVEIL

### Orbital Edge Intelligence for Planetary Resilience

<br />

[![Python](https://img.shields.io/badge/Python-3.10+-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev)
[![Leaflet](https://img.shields.io/badge/Leaflet-199900?style=for-the-badge&logo=leaflet&logoColor=white)](https://leafletjs.com)
[![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://docker.com)

<br />

![Tests](https://img.shields.io/badge/Tests-69_Passed-4ade80?style=flat-square&logo=pytest&logoColor=white)
![Coverage](https://img.shields.io/badge/Coverage-94%25-22c55e?style=flat-square)
![License](https://img.shields.io/badge/License-MIT-a78bfa?style=flat-square)
![Status](https://img.shields.io/badge/Status-Production_Ready-38bdf8?style=flat-square)

<br />

**TerraVeil** is an AI-powered, full-stack geospatial intelligence platform that simulates **Orbital Edge Computing (OEC)** to deliver real-time flood detection, drought monitoring, and infrastructure risk assessment from satellite imagery.

Built for the **COSMEON HackX 4.0** challenge (PS-06), it processes Sentinel-1 SAR and Sentinel-2 Optical data through a distributed, consensus-driven pipeline — transforming raw satellite feeds into actionable disaster intelligence in seconds.

<br />

---

</div>

<br />

## ⚡ Why TerraVeil?

<table>
<tr>
<td width="50%">

### 🌊 The Problem
Traditional flood monitoring relies on centralized ground stations that take **hours to days** to produce actionable intelligence. During the critical first 72 hours of a flood event, this latency costs lives.

</td>
<td width="50%">

### 🛰 The Solution
TerraVeil simulates a constellation of **Low Earth Orbit (LEO) edge-computing satellites** that process data _on-orbit_, achieving **< 800ms latency** with 380,000:1 data compression via the **COSMEON protocol**.

</td>
</tr>
</table>

<br />

## 🏗️ Architecture

```
                    ┌─────────────────────────────────────────────────────┐
                    │              🌐  TERRAVEIL PLATFORM                 │
                    └────────────────────────┬────────────────────────────┘
                                             │
                    ┌────────────────────────┼────────────────────────────┐
                    │                        │                            │
            ┌───────┴───────┐      ┌─────────┴────────┐      ┌──────────┴──────────┐
            │  🎨 FRONTEND  │      │  ⚙️  BACKEND API  │      │  🛰  ORBITAL LAYER  │
            │               │      │                    │      │                     │
            │  React + Vite │◄────►│  FastAPI (Python)  │◄────►│  COSMEON Consensus  │
            │  Framer Motion│      │  Async Pipelines   │      │  Multi-Node OEC     │
            │  Leaflet Maps │      │  SQLite Storage    │      │  Bayesian Protocol  │
            └───────────────┘      └────────────────────┘      └─────────────────────┘
                                             │
                              ┌──────────────┼──────────────┐
                              │              │              │
                        ┌─────┴─────┐  ┌─────┴─────┐  ┌────┴─────┐
                        │ Sentinel-2│  │ Sentinel-1│  │ OpenMeteo│
                        │  Optical  │  │    SAR    │  │ Forecast │
                        └───────────┘  └───────────┘  └──────────┘
```

<br />

## 🔬 10-Step Analysis Pipeline

TerraVeil's core intelligence engine processes satellite data through a rigorous, end-to-end pipeline:

| Step | Module | Description |
|:----:|--------|-------------|
| `01` | **Satellite Ingestion** | Fetches Sentinel-2 (optical) and Sentinel-1 (SAR) imagery for the target region and date range |
| `02` | **NDWI Computation** | Calculates Normalized Difference Water Index from Green and NIR bands to identify surface water |
| `03` | **SAR Analysis** | Processes radar backscatter data for all-weather, day/night flood detection through VV-polarized thresholding |
| `04` | **NDDI Mapping** | Generates Normalized Difference Drought Index for slow-onset drought monitoring and severity classification |
| `05` | **Change Detection** | Performs temporal differencing between pre-event and post-event imagery to isolate flood extent |
| `06` | **Orbital Edge Inference** | Distributes analysis across 3 simulated LEO nodes, each generating independent inference packets |
| `07` | **Bayesian Consensus** | Aggregates multi-node results using a weighted Bayesian consensus protocol with configurable trust weights |
| `08` | **Infrastructure Overlay** | Intersects flood polygons with OpenStreetMap data — hospitals, roads, schools, power stations |
| `09` | **Risk Classification** | Computes composite risk score (0–1) from NDWI, SAR, change magnitude, and infrastructure exposure |
| `10` | **Forecast & Report** | Generates 72-hour weather trajectory, vulnerability forecast, and caches the final intelligence package |

<br />

## 🎨 Frontend Experience

The dashboard is built with a **premium glassmorphic design language** — silver-black aesthetics, micro-animations, and smooth transitions that make geospatial intelligence feel cinematic.

### Key Interface Components

| Component | Purpose |
|-----------|---------|
| **Login Portal** | Themed authentication with orbital-grade security branding |
| **Boot Sequence** | Cinematic system initialization with real-time progress indicators |
| **Home Dashboard** | Mission overview, capabilities grid, and quick-launch analysis |
| **Scan Configuration** | Region selector (preset + custom), date range picker, scan launcher |
| **Orbital Animation** | Dynamic satellite scan visualization with region-specific SVG maps |
| **Results Dashboard** | Interactive Leaflet map, flood overlays, risk cards, infrastructure markers |
| **Forecast Panel** | 72-hour precipitation, temperature, wind speed, and vulnerability trajectory |
| **Node Telemetry** | Real-time COSMEON node status, consensus metrics, and bandwidth stats |
| **Mission Logs** | Scrollable terminal-style log viewer for pipeline execution details |
| **About Page** | Full-page overview of TerraVeil's mission, team, and technology |

<br />

## 📡 API Reference

All endpoints are served under `/api/v1`.

| Method | Endpoint | Description |
|:------:|----------|-------------|
| `POST` | `/scan` | Submit a scan request with region, bbox, and date range |
| `GET` | `/risk` | Retrieve risk assessment for a region and date |
| `GET` | `/logs` | Fetch pipeline execution logs |
| `GET` | `/nodes` | Get COSMEON node status and telemetry |
| `GET` | `/history` | Browse scan history and cached results |
| `GET` | `/health` | Health check endpoint |

> 💡 Interactive API documentation available at `http://localhost:8000/docs` (Swagger UI)

<br />

## 🚀 Getting Started

### Prerequisites

| Tool | Version | Purpose |
|------|---------|---------|
| **Node.js** | 18+ | Frontend development |
| **Python** | 3.10+ | Backend API and pipeline |
| **Docker** | 24+ | _(Optional)_ Containerized deployment |

### Quick Start

#### 1 · Clone the Repository
```bash
git clone https://github.com/kthiru-44/SiliconDuo_PS06.git
cd SiliconDuo_PS06
```

#### 2 · Start the Backend API
```bash
cd backend
python -m venv venv

# Windows
venv\Scripts\activate

# macOS / Linux
source venv/bin/activate

pip install -r requirements.txt
python -m uvicorn app.main:app --reload --port 8000
```
> 🛰 API live at **http://localhost:8000** · Docs at **http://localhost:8000/docs**

#### 3 · Start the Frontend Dashboard
```bash
cd frontend
npm install
npm run dev
```
> 🎨 Dashboard live at **http://localhost:5173**

#### 4 · _(Optional)_ Docker Compose
```bash
docker-compose up --build
```
> Backend: `localhost:8000` · Frontend: `localhost:3000`

<br />

### Environment Configuration

Copy the example and configure:
```bash
cp .env.example .env
```

| Variable | Description | Required |
|----------|-------------|:--------:|
| `GEE_SERVICE_ACCOUNT` | Google Earth Engine service account email | ✅ |
| `GEE_KEY_FILE` | Path to GEE service key JSON | ✅ |
| `DB_PATH` | SQLite database file path | ⬜ |
| `CORS_ORIGINS` | Allowed frontend origins | ⬜ |
| `APP_ENV` | `development` or `production` | ⬜ |

<br />

## 🧪 Testing

The backend ships with **69 automated test cases** covering API endpoints, pipeline modules, and validation logic.

```bash
cd backend
python -m pytest tests/ -v --tb=short
```

| Suite | Tests | Covers |
|-------|:-----:|--------|
| `test_api.py` | 35 | All REST endpoints, error handling, validation |
| `test_pipeline.py` | 34 | NDWI, SAR, NDDI, change detection, risk scoring, forecast |

<br />

## 📂 Project Structure

```
TerraVeil/
├── 🖥️  frontend/               # React + Vite Dashboard
│   └── src/
│       ├── components/
│       │   ├── auth/           # Login portal
│       │   ├── boot/           # Cinematic boot sequence
│       │   ├── animation/      # Orbital scan animation
│       │   ├── home/           # Home dashboard
│       │   ├── scan/           # Scan configuration
│       │   ├── dashboard/      # Results dashboard & risk cards
│       │   ├── map/            # Leaflet map & flood overlays
│       │   ├── forecast/       # Weather & drought panels
│       │   ├── logs/           # Mission log viewer
│       │   ├── nodes/          # COSMEON node telemetry
│       │   └── about/          # About page & modal
│       ├── services/           # API client & data normalization
│       └── hooks/              # Custom React hooks
│
├── ⚙️  backend/                # FastAPI (Python)
│   ├── app/
│   │   ├── api/routes/         # REST endpoints (scan, risk, logs, nodes, history)
│   │   ├── pipeline/           # 10-step analysis pipeline
│   │   ├── orbital/            # COSMEON consensus & node simulation
│   │   ├── db/                 # SQLite database layer
│   │   ├── models/             # Pydantic schemas
│   │   └── core/               # Configuration & constants
│   └── tests/                  # 69 Pytest cases
│
├── 📜  scripts/                # Utility scripts
│   ├── precache_regions.py     # Pre-populate region caches
│   └── verify_cache.py         # Cache integrity verification
│
├── 🐳  docker-compose.yml      # Container orchestration
├── 📄  .env.example            # Environment template
└── 📋  LICENSE                 # MIT License
```

<br />

## 🌍 Supported Regions

TerraVeil comes pre-configured with three high-risk regions, plus support for any custom location:

| Region | Coordinates | Risk Profile |
|--------|:-----------:|-------------|
| 🇮🇳 **Kolhapur, Maharashtra** | 16.7°N, 74.2°E | Monsoon flooding, Panchganga River basin |
| 🇮🇳 **Chennai, Tamil Nadu** | 13.1°N, 80.3°E | Cyclonic flooding, coastal surge |
| 🇵🇰 **Sindh, Pakistan** | 25.4°N, 68.4°E | Indus River flooding, monsoon extremes |
| 📍 **Custom Location** | _User-defined_ | Any global coordinate with lat/lon input |

<br />

## 🔑 Key Technologies

<table>
<tr>
<td align="center" width="20%"><b>🐍 Python</b><br/><sub>Core engine</sub></td>
<td align="center" width="20%"><b>⚡ FastAPI</b><br/><sub>Async API</sub></td>
<td align="center" width="20%"><b>⚛️ React 19</b><br/><sub>UI framework</sub></td>
<td align="center" width="20%"><b>🗺️ Leaflet</b><br/><sub>Interactive maps</sub></td>
<td align="center" width="20%"><b>🎬 Framer Motion</b><br/><sub>Animations</sub></td>
</tr>
<tr>
<td align="center"><b>🛰 GEE</b><br/><sub>Satellite data</sub></td>
<td align="center"><b>📊 NumPy/SciPy</b><br/><sub>Computation</sub></td>
<td align="center"><b>🗄️ SQLite</b><br/><sub>Persistence</sub></td>
<td align="center"><b>🐳 Docker</b><br/><sub>Deployment</sub></td>
<td align="center"><b>🌤️ OpenMeteo</b><br/><sub>Weather API</sub></td>
</tr>
</table>

<br />

## 👥 Team

Built with ❤️ by **Team COSMEON** for **HackX 4.0 — PS-06**

<br />

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

<br />

---

<div align="center">

<br />

**🛰 TERRAVEIL** · Orbital Edge Intelligence

_Making disaster intelligence accessible, affordable, and instant._

<br />

![Made with Love](https://img.shields.io/badge/Made_with-❤️-ff6b6b?style=for-the-badge)
![Powered by AI](https://img.shields.io/badge/Powered_by-AI-7c3aed?style=for-the-badge)
![Built for Resilience](https://img.shields.io/badge/Built_for-Resilience-0ea5e9?style=for-the-badge)

</div>
