"""Infrastructure overlay via OSMnx — fetch and intersect with flood mask."""

import numpy as np


def fetch_infrastructure(bbox: dict) -> list[dict]:
    """
    Fetch infrastructure from OpenStreetMap for the given bbox.
    Uses OSMnx with a timeout, falls back to simulated data.
    """
    try:
        import osmnx  # quick import test
        import concurrent.futures
        with concurrent.futures.ThreadPoolExecutor() as executor:
            future = executor.submit(_fetch_from_osm, bbox)
            return future.result(timeout=15)
    except Exception as e:
        print(f"[INFRA] OSM fetch failed/timed out: {e}. Using simulated data.")
        return _simulate_infrastructure(bbox)


def _fetch_from_osm(bbox: dict) -> list[dict]:
    """Real OSMnx fetch — compatible with OSMnx 2.x."""
    import osmnx as ox

    # OSMnx 2.x uses bbox=(west, south, east, north) tuple
    osm_bbox = (bbox["west"], bbox["south"], bbox["east"], bbox["north"])

    tags_map = {
        "hospital": {"amenity": "hospital"},
        "school": {"amenity": "school"},
        "bridge": {"bridge": True},
        "water_treatment": {"man_made": "water_works"},
    }

    results = []
    for infra_type, tags in tags_map.items():
        try:
            gdf = ox.features_from_bbox(bbox=osm_bbox, tags=tags)
            for _, row in gdf.iterrows():
                centroid = row.geometry.centroid
                name = row.get("name", f"Unnamed {infra_type}")
                results.append({
                    "type": infra_type,
                    "name": str(name) if name else f"Unnamed {infra_type}",
                    "lat": centroid.y,
                    "lon": centroid.x,
                    "risk_level": "UNKNOWN",
                })
        except Exception as e:
            print(f"[INFRA] Failed to fetch {infra_type}: {e}")
            continue

    # Also fetch major roads
    try:
        G = ox.graph_from_bbox(bbox=osm_bbox, network_type="drive")
        edges = ox.graph_to_gdfs(G, nodes=False)
        total_road_km = edges["length"].sum() / 1000 if "length" in edges.columns else 0
        results.append({
            "type": "road_network",
            "name": f"Road network ({total_road_km:.1f} km)",
            "lat": (bbox["north"] + bbox["south"]) / 2,
            "lon": (bbox["east"] + bbox["west"]) / 2,
            "risk_level": "UNKNOWN",
            "total_km": total_road_km,
        })
        print(f"[INFRA] Found {len(results)} features, {total_road_km:.1f} km roads")
    except Exception as e:
        print(f"[INFRA] Road fetch failed: {e}")

    return results


def _simulate_infrastructure(bbox: dict) -> list[dict]:
    """Generate simulated infrastructure for demo regions."""
    center_lat = (bbox["north"] + bbox["south"]) / 2
    center_lon = (bbox["east"] + bbox["west"]) / 2

    return [
        {"type": "hospital", "name": "District General Hospital", "lat": center_lat + 0.02, "lon": center_lon - 0.01, "risk_level": "HIGH"},
        {"type": "hospital", "name": "Civil Hospital", "lat": center_lat - 0.05, "lon": center_lon + 0.03, "risk_level": "MEDIUM"},
        {"type": "hospital", "name": "Primary Health Centre", "lat": center_lat + 0.08, "lon": center_lon + 0.05, "risk_level": "CRITICAL"},
        {"type": "school", "name": "Government High School", "lat": center_lat + 0.01, "lon": center_lon + 0.02, "risk_level": "HIGH"},
        {"type": "school", "name": "Municipal Primary School", "lat": center_lat - 0.03, "lon": center_lon - 0.04, "risk_level": "MEDIUM"},
        {"type": "bridge", "name": "National Highway Bridge", "lat": center_lat, "lon": center_lon - 0.06, "risk_level": "CRITICAL"},
        {"type": "bridge", "name": "District Road Bridge", "lat": center_lat + 0.04, "lon": center_lon + 0.01, "risk_level": "HIGH"},
        {"type": "water_treatment", "name": "Water Treatment Plant", "lat": center_lat - 0.02, "lon": center_lon + 0.06, "risk_level": "HIGH"},
        {"type": "road_network", "name": "Road network (87.3 km)", "lat": center_lat, "lon": center_lon, "risk_level": "HIGH", "total_km": 87.3},
    ]


def intersect_with_flood(infrastructure: list[dict], flood_mask: np.ndarray,
                         bbox: dict) -> list[dict]:
    """
    Determine which infrastructure items fall within the flood zone.
    Updates risk_level based on flood mask intersection.
    """
    h, w = flood_mask.shape
    lat_range = bbox["north"] - bbox["south"]
    lon_range = bbox["east"] - bbox["west"]

    for item in infrastructure:
        # Convert lat/lon to pixel coordinates
        row = int((bbox["north"] - item["lat"]) / lat_range * h)
        col = int((item["lon"] - bbox["west"]) / lon_range * w)

        row = max(0, min(row, h - 1))
        col = max(0, min(col, w - 1))

        # Check surrounding area (5-pixel radius)
        r_min = max(0, row - 5)
        r_max = min(h, row + 6)
        c_min = max(0, col - 5)
        c_max = min(w, col + 6)

        patch = flood_mask[r_min:r_max, c_min:c_max]
        flood_fraction = np.mean(patch) if patch.size > 0 else 0

        if flood_fraction > 0.5:
            item["risk_level"] = "CRITICAL"
        elif flood_fraction > 0.2:
            item["risk_level"] = "HIGH"
        elif flood_fraction > 0.05:
            item["risk_level"] = "MEDIUM"
        else:
            item["risk_level"] = "LOW"

    return infrastructure


def count_at_risk(infrastructure: list[dict]) -> dict:
    """Count infrastructure at risk (MEDIUM or above)."""
    at_risk = ("MEDIUM", "HIGH", "CRITICAL")
    hospitals = sum(1 for i in infrastructure if i["type"] == "hospital" and i["risk_level"] in at_risk)
    roads_km = sum(i.get("total_km", 0) for i in infrastructure if i["type"] == "road_network" and i["risk_level"] in at_risk)

    return {
        "hospitals_at_risk": hospitals,
        "roads_km_affected": roads_km,
    }
