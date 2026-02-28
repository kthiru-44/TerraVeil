"""Pre-cache all demo regions to SQLite for demo day. Run before Hour 20."""

import sys
import asyncio
sys.path.insert(0, ".")

from app.core.config import DEMO_REGIONS
from app.db.database import init_db
from app.db import queries as db
from app.pipeline.runner import run_pipeline


async def precache():
    init_db()
    print("🛰  TerraVeil Pre-Cache Script")
    print("=" * 50)

    for key, region in DEMO_REGIONS.items():
        print(f"\n📡 Processing: {region['name']} ({key})")
        print(f"   Dates: {region['t0']} → {region['t1']}")

        # Check if already cached
        existing = await db.get_scan_by_region(key, region["t1"])
        if existing and existing["status"] == "completed":
            print(f"   ✅ Already cached (scan_id: {existing['scan_id']})")
            continue

        scan_id = await db.create_scan(
            region_name=region["name"],
            bbox=region["bbox"],
            t0=region["t0"],
            t1=region["t1"],
            source=region["source"],
        )
        print(f"   🔄 Running pipeline (scan_id: {scan_id})...")

        try:
            await run_pipeline(scan_id, region["name"], region["bbox"],
                              region["t0"], region["t1"], region["source"])
            result = await db.get_scan(scan_id)
            print(f"   ✅ Done! Risk: {result['risk_level']} | Score: {result['risk_score']} | {result['processing_ms']}ms")
        except Exception as e:
            print(f"   ❌ Failed: {e}")

    print("\n" + "=" * 50)
    print("🏁 Pre-cache complete. Verify with: python scripts/verify_cache.py")


if __name__ == "__main__":
    asyncio.run(precache())
