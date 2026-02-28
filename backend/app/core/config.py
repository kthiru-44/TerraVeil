"""Core configuration for TerraVeil backend."""

import os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

# Paths
BASE_DIR = Path(__file__).resolve().parent.parent.parent
DB_PATH = os.getenv("DB_PATH", str(BASE_DIR / "terraveil.db"))
STATIC_DIR = BASE_DIR / "static"
GEOTIFF_DIR = STATIC_DIR / "geotiffs"
CACHE_DIR = STATIC_DIR / "cache"

# Ensure directories exist
STATIC_DIR.mkdir(parents=True, exist_ok=True)
GEOTIFF_DIR.mkdir(parents=True, exist_ok=True)
CACHE_DIR.mkdir(parents=True, exist_ok=True)

# GEE
GEE_SERVICE_ACCOUNT = os.getenv("GEE_SERVICE_ACCOUNT", "")
GEE_KEY_FILE = os.getenv("GEE_KEY_FILE", "")

# App
APP_ENV = os.getenv("APP_ENV", "development")
CORS_ORIGINS = os.getenv("CORS_ORIGINS", "http://localhost:5173").split(",")

# Demo regions (pre-cached)
DEMO_REGIONS = {
    "kolhapur": {
        "name": "Kolhapur, Maharashtra",
        "bbox": {"north": 16.85, "south": 16.55, "east": 74.35, "west": 74.05},
        "t0": "2021-06-15",
        "t1": "2021-07-22",
        "source": "sentinel-2",
    },
    "chennai": {
        "name": "Chennai, Tamil Nadu",
        "bbox": {"north": 13.25, "south": 12.85, "east": 80.40, "west": 80.05},
        "t0": "2021-10-15",
        "t1": "2021-11-18",
        "source": "sentinel-2",
    },
    "pakistan": {
        "name": "Sindh, Pakistan",
        "bbox": {"north": 27.00, "south": 26.50, "east": 68.60, "west": 68.10},
        "t0": "2022-07-15",
        "t1": "2022-08-28",
        "source": "sentinel-2",
    },
}
