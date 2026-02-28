"""TerraVeil FastAPI application — COSMEON Orbital Intelligence Layer."""

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.core.config import CORS_ORIGINS, STATIC_DIR
from app.db.database import init_db
from app.api.routes import scan, risk, logs, nodes, history


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup: init DB. Shutdown: nothing special."""
    init_db()
    print("🛰  TerraVeil v3 — COSMEON Orbital Intelligence Layer")
    print("📊 Database initialized")
    print("🚀 Ready at http://localhost:8000")
    print("📡 Demo: curl 'http://localhost:8000/api/v1/risk?region=kolhapur&date=2021-07-22'")
    yield


app = FastAPI(
    title="TerraVeil API",
    description="COSMEON Orbital Intelligence Layer — Satellite flood & drought detection",
    version="3.0.0",
    lifespan=lifespan,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Static files (GeoTIFFs, cached images)
app.mount("/static", StaticFiles(directory=str(STATIC_DIR)), name="static")

# API routes — all under /api/v1
app.include_router(scan.router, prefix="/api/v1", tags=["Scan"])
app.include_router(risk.router, prefix="/api/v1", tags=["Risk"])
app.include_router(logs.router, prefix="/api/v1", tags=["Logs"])
app.include_router(nodes.router, prefix="/api/v1", tags=["Nodes"])
app.include_router(history.router, prefix="/api/v1", tags=["History"])


@app.get("/")
async def root():
    return {
        "service": "TerraVeil",
        "version": "3.0.0",
        "description": "COSMEON Orbital Intelligence Layer",
        "docs": "/docs",
        "demo": "/api/v1/risk?region=kolhapur&date=2021-07-22",
    }


@app.get("/health")
async def health():
    return {"status": "ok", "service": "terraveil"}
