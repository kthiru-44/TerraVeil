# TerraVeil 🌍🛰️
**Orbital Edge Intelligence for Planetary Resilience**

TerraVeil is a full-stack, AI-powered platform designed to provide rapid, edge-computed geospatial intelligence for disaster response, specifically focusing on flood detection, drought monitoring, and infrastructure risk assessment. 

By simulating orbital edge computing (OEC) consensus and utilizing multi-modal satellite data (Sentinel-1 SAR, Sentinel-2 Optical), TerraVeil delivers real-time, actionable insights for both predefined vulnerable regions and on-demand custom geographic bounding boxes.

## 🚀 Features

- **Dynamic GIS Dashboard:** A high-performance React/Vite frontend featuring live-updating Leaflet maps, animated data visualizations, and detailed telemetry metrics.
- **Custom Region Scanning:** Instantly submit any geographic coordinate to the backend to generate dynamic risk overlays, localized infrastructure mapping, and custom GeoJSON flood envelopes.
- **10-Step Analysis Pipeline:**
  1. Satellite Data Ingestion (Optical & SAR)
  2. NDWI (Normalized Difference Water Index) Computation
  3. SAR Analysis & Thresholding
  4. Time-series Change Detection
  5. Multi-Node Orbital Edge Inference (OEC)
  6. Bayesian Consensus Protocol
  7. Infrastructure Intersection (Hospitals, Roads, Schools)
  8. Composite Risk Classification
  9. 72-Hour Weather Forecast & Vulnerability Trajectory
  10. Final Report Generation & Caching
- **Rigorous Test Suite:** Backed by 69 automated Pytest cases guaranteeing stability across API endpoints, data pipelines, and validation logic.
- **Drought & Flood Monitoring:** Tracks slow-onset disasters (NDDI mapping) alongside immediate flood events.

## 🏗️ Architecture

- **Backend:** FastAPI (Python), Async Pipelines, SQLite (asyncpg compatible layout).
- **Frontend:** React, Vite, Framer Motion (UI Animations), React-Leaflet (Mapping).
- **Data Science:** NumPy, SciPy (for morphological cleanup and data manipulation).

## ⚡ Getting Started

### Prerequisites
- Node.js (for frontend)
- Python 3.10+ (for backend)

### 1. Start the Backend API
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python3 -m uvicorn app.main:app --reload --port 8000
```
*The API will be available at http://localhost:8000*

### 2. Start the Frontend Dashboard
```bash
cd frontend
npm install
npm run dev
```
*The Dashboard will be live at http://localhost:5173*

## 🧪 Testing

The backend includes a comprehensive test suite (including cross-endpoint integration and module unit tests).
```bash
cd backend
python3 -m pytest tests/ -v
```

## 📄 License
This project is licensed under the MIT License.
