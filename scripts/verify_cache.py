"""Verify all demo regions are cached and ready."""

import sys
import asyncio
sys.path.insert(0, ".")

from app.core.config import DEMO_REGIONS
from app.db.database import init_db
from app.db import queries as db


async def verify():
    init_db()
    print("🔍 TerraVeil Cache Verification")
    print("=" * 50)

    all_ok = True
    for key, region in DEMO_REGIONS.items():
        scan = await db.get_scan_by_region(key, region["t1"])
        if scan and scan["status"] == "completed":
            print(f"✅ {region['name']}")
            print(f"   Risk: {scan['risk_level']} | Score: {scan['risk_score']} | Confidence: {scan['confidence']}")
            print(f"   Flood: {scan['flood_area_km2']} km² | Pop: {scan['pop_affected']}")
        else:
            print(f"❌ {region['name']} — NOT CACHED. Run: python scripts/precache_regions.py")
            all_ok = False

    print("\n" + "=" * 50)
    if all_ok:
        print("🎉 All demo regions cached and ready!")
    else:
        print("⚠️  Some regions missing. Run precache script.")


if __name__ == "__main__":
    asyncio.run(verify())
