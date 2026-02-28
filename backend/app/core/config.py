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
GEE_PROJECT = os.getenv("GEE_PROJECT", "terraveil-488815")

# App
APP_ENV = os.getenv("APP_ENV", "development")
CORS_ORIGINS = os.getenv("CORS_ORIGINS", "http://localhost:5173").split(",")

# Demo regions (pre-cached)
DEMO_REGIONS = {
    "kolhapur": {
        "name": "Kolhapur, Maharashtra",
        "bbox": {"north": 16.9, "south": 16.5, "east": 74.4, "west": 74.0},
        "t0": "2021-07-15",
        "t1": "2021-07-25",
        "source": "sentinel-2",
    },
    "chennai": {
        "name": "Chennai, Tamil Nadu",
        "bbox": {"north": 13.2, "south": 12.8, "east": 80.4, "west": 80.05},
        "t0": "2023-12-01",
        "t1": "2023-12-15",
        "source": "sentinel-2",
    },
    "bangalore": {
        "name": "Bangalore, Karnataka",
        "bbox": {"north": 13.10, "south": 12.85, "east": 77.75, "west": 77.45},
        "t0": "2022-09-01",
        "t1": "2022-09-10",
        "source": "sentinel-2",
    },
    "mumbai": {
        "name": "Mumbai, Maharashtra",
        "bbox": {"north": 19.20, "south": 18.90, "east": 73.05, "west": 72.75},
        "t0": "2023-07-10",
        "t1": "2023-07-20",
        "source": "sentinel-2",
    },
    "delhi": {
        "name": "Delhi NCR",
        "bbox": {"north": 28.75, "south": 28.45, "east": 77.35, "west": 76.95},
        "t0": "2023-07-08",
        "t1": "2023-07-15",
        "source": "sentinel-2",
    },
    "kerala": {
        "name": "Kerala (Wayanad)",
        "bbox": {"north": 11.85, "south": 11.55, "east": 76.20, "west": 75.80},
        "t0": "2024-07-25",
        "t1": "2024-08-05",
        "source": "sentinel-2",
    },
    "pakistan": {
        "name": "Sindh, Pakistan",
        "bbox": {"north": 27.0, "south": 26.5, "east": 68.6, "west": 68.1},
        "t0": "2022-08-20",
        "t1": "2022-09-01",
        "source": "sentinel-2",
    },
}
