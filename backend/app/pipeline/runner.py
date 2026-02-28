"""Pipeline runner — orchestrates all 10 pipeline steps with DB logging."""

import time
import json
import asyncio
import numpy as np
from datetime import datetime, timezone

from app.db import queries as db
from app.pipeline.satellite_ingestion import fetch_sentinel2, fetch_sentinel1
from app.pipeline.ndwi import compute_ndwi, detect_flood, compute_flood_probability
from app.pipeline.nddi import compute_ndvi, compute_nddi, classify_drought
from app.pipeline.sar import compute_sar_flood_mask, fuse_masks, should_use_sar_primary
from app.pipeline.change_detection import detect_change
from app.pipeline.infrastructure import fetch_infrastructure, intersect_with_flood, count_at_risk
from app.pipeline.forecast import fetch_openmeteo_forecast, compute_ndwi_trend, compute_forecast_score, compute_drought_trajectory
from app.pipeline.risk_classifier import classify_risk, estimate_population
from app.orbital.node import OrbitalNode
from app.orbital.consensus import run_consensus
from app.core.constants import OEC_NODE_IDS


async def run_pipeline(scan_id: str, region: str, bbox: dict, t0: str, t1: str, source: str = "sentinel-2"):
    """
    Full TerraVeil analysis pipeline. Orchestrates 10 steps, logs each to DB.

    Steps:
    1. SATELLITE_INGESTION
    2. NDWI_COMPUTATION
    3. SAR_ANALYSIS
    4. CHANGE_DETECTION
    5. OEC_INFERENCE
    6. CONSENSUS
    7. INFRASTRUCTURE_OVERLAY
    8. RISK_CLASSIFICATION
    9. FORECAST_72H
    10. REPORT_GENERATION
    """
    pipeline_start = time.time()
    await db.update_scan_status(scan_id, "running")

    try:
        # ── Step 1: SATELLITE INGESTION ──────────────────────────
        lid = await db.log_step(scan_id, "SATELLITE_INGESTION", 1, "running",
                                input_summary={"source": source, "dates": [t0, t1], "bbox": bbox})
        s2_data = fetch_sentinel2(bbox, t0, t1)
        s1_data = fetch_sentinel1(bbox, t0, t1)
        await db.complete_log_step(lid, output_summary={
            "tiles": s2_data.get("tiles", 2),
            "cloud_pct": s2_data.get("cloud_pct", 3.2),
            "source": s2_data.get("source", "simulated"),
        })

        # ── Step 2: NDWI COMPUTATION ────────────────────────────
        lid = await db.log_step(scan_id, "NDWI_COMPUTATION", 2, "running")

        # Compute pixel area from bbox and grid dimensions
        import math
        dlat = abs(bbox["north"] - bbox["south"])
        dlon = abs(bbox["east"] - bbox["west"])
        lat_mid = (bbox["north"] + bbox["south"]) / 2
        bbox_width_km = dlon * 111.32 * math.cos(math.radians(lat_mid))
        bbox_height_km = dlat * 110.574
        grid_h, grid_w = s2_data["baseline"]["green"].shape
        pixel_area_km2 = (bbox_width_km * bbox_height_km) / (grid_h * grid_w)
        print(f"[PIPELINE] Grid {grid_h}x{grid_w}, pixel_area={pixel_area_km2:.4f} km²")

        ndwi_before = compute_ndwi(s2_data["baseline"]["green"], s2_data["baseline"]["nir"])
        ndwi_after = compute_ndwi(s2_data["event"]["green"], s2_data["event"]["nir"])
        flood_mask, flood_area_km2, ndwi_mean = detect_flood(ndwi_before, ndwi_after, pixel_area_km2=pixel_area_km2)

        # NDDI for drought
        ndvi_after = compute_ndvi(s2_data["event"]["nir"], s2_data["event"]["green"])
        nddi = compute_nddi(ndvi_after, ndwi_after)
        drought_info = classify_drought(nddi)

        await db.complete_log_step(lid, output_summary={
            "ndwi_mean": round(ndwi_mean, 4),
            "flooded_px": int(np.sum(flood_mask)),
            "flood_area_km2": round(flood_area_km2, 2),
            "nddi_mean": round(drought_info["nddi_mean"], 4),
            "drought_severity": drought_info["severity"],
        })

        # ── Step 3: SAR ANALYSIS ────────────────────────────────
        lid = await db.log_step(scan_id, "SAR_ANALYSIS", 3, "running")
        sar_mask, sar_threshold = compute_sar_flood_mask(s1_data["vv"])

        # Force SAR-primary when: S2 was simulated but S1 is real, OR high cloud cover
        s2_simulated = s2_data.get("source") == "simulated"
        s1_real = s1_data.get("source") == "gee"
        cloud = s2_data.get("cloud_pct", 0)
        use_sar_primary = should_use_sar_primary(cloud) or (s2_simulated and s1_real)

        if use_sar_primary:
            combined_mask = sar_mask
            # When SAR is primary, recompute flood area from SAR
            flood_area_km2 = float(np.sum(sar_mask) * pixel_area_km2)
            print(f"[PIPELINE] SAR PRIMARY (cloud={cloud:.0f}%, s2={s2_data.get('source')}, s1={s1_data.get('source')})")
        else:
            combined_mask = fuse_masks(flood_mask, sar_mask)
            print(f"[PIPELINE] FUSED S2+SAR (cloud={cloud:.0f}%)")

        # Recompute area with fused/sar mask
        fused_flood_area = float(np.sum(combined_mask) * pixel_area_km2)
        await db.complete_log_step(lid, output_summary={
            "sar_threshold_db": round(sar_threshold, 2),
            "sar_primary": use_sar_primary,
            "cloud_pct": round(cloud, 1),
            "fused_flood_area_km2": round(fused_flood_area, 2),
        })

        # ── Step 4: CHANGE DETECTION ───────────────────────────
        lid = await db.log_step(scan_id, "CHANGE_DETECTION", 4, "running")
        delta, change_mask, change_area_km2 = detect_change(ndwi_before, ndwi_after, pixel_area_km2=pixel_area_km2)
        await db.complete_log_step(lid, output_summary={
            "change_area_km2": round(change_area_km2, 2),
            "mean_delta": round(float(np.mean(delta)), 4),
        })

        # ── Step 5: OEC INFERENCE ──────────────────────────────
        lid = await db.log_step(scan_id, "OEC_INFERENCE", 5, "running")

        lat_mid = (bbox["north"] + bbox["south"]) / 2
        lon_mid = (bbox["east"] + bbox["west"]) / 2
        tile_bboxes = [
            {"north": bbox["north"], "south": lat_mid, "east": lon_mid, "west": bbox["west"]},
            {"north": bbox["north"], "south": lat_mid, "east": bbox["east"], "west": lon_mid},
            {"north": lat_mid, "south": bbox["south"], "east": bbox["east"], "west": bbox["west"]},
        ]

        nodes = [
            OrbitalNode(nid, tbbox, region)
            for nid, tbbox in zip(OEC_NODE_IDS, tile_bboxes)
        ]
        packets = await asyncio.gather(*[node.process(s2_data) for node in nodes])

        # Save node telemetry to DB
        for pkt in packets:
            await db.save_node_telemetry(
                scan_id=scan_id, node_id=pkt.node_id, tile_region=region,
                inference_ms=pkt.compute_ms, raw_data_mb=pkt.raw_data_mb,
                packet_kb=pkt.packet_kb, bandwidth_ratio=pkt.bandwidth_ratio,
                flood_detected=pkt.flood_detected, ndwi_mean=pkt.ndwi_mean,
                confidence=pkt.confidence,
            )

        await db.complete_log_step(lid, output_summary={
            "nodes_processed": len(packets),
            "node_results": [{"id": p.node_id, "status": p.status, "ms": p.compute_ms} for p in packets],
        })

        # ── Step 6: CONSENSUS ──────────────────────────────────
        lid = await db.log_step(scan_id, "CONSENSUS", 6, "running")
        consensus = run_consensus(list(packets))
        await db.complete_log_step(lid, output_summary={
            "status": consensus["status"],
            "confidence": consensus["confidence"],
            "flood_area_km2": consensus["flood_area_km2"],
            "nodes_responding": consensus["nodes_responded"],
        })

        # Use consensus values
        final_flood_area = consensus["flood_area_km2"]
        final_confidence = consensus["confidence"]
        conf_lower = consensus["confidence_lower"]
        conf_upper = consensus["confidence_upper"]
        final_ndwi_mean = consensus["ndwi_mean"]

        # ── Step 7: INFRASTRUCTURE OVERLAY ─────────────────────
        lid = await db.log_step(scan_id, "INFRASTRUCTURE_OVERLAY", 7, "running")
        infra = fetch_infrastructure(bbox)
        infra = intersect_with_flood(infra, combined_mask, bbox)
        risk_counts = count_at_risk(infra)
        pop_affected = estimate_population(final_flood_area)

        # Convert infrastructure to serializable format with coords key
        infra_serializable = []
        for item in infra:
            infra_serializable.append({
                "type": item["type"],
                "name": item["name"],
                "coords": [item["lat"], item["lon"]],
                "risk_level": item["risk_level"],
                "total_km": item.get("total_km", 0),
            })

        await db.complete_log_step(lid, output_summary={
            "total_features": len(infra),
            "hospitals_at_risk": risk_counts["hospitals_at_risk"],
            "roads_km_affected": round(risk_counts["roads_km_affected"], 1),
            "pop_affected": pop_affected,
        })

        # ── Step 8: RISK CLASSIFICATION ────────────────────────
        lid = await db.log_step(scan_id, "RISK_CLASSIFICATION", 8, "running")
        risk_result = classify_risk(
            flood_area_km2=final_flood_area,
            confidence=final_confidence,
            pop_affected=pop_affected,
            ndwi_mean=final_ndwi_mean,
            hospitals_at_risk=risk_counts["hospitals_at_risk"],
        )
        await db.complete_log_step(lid, output_summary={
            "risk_level": risk_result["risk_level"],
            "risk_score": risk_result["risk_score"],
            "components": risk_result["components"],
        })

        # ── Step 9: FORECAST 72H ──────────────────────────────
        lid = await db.log_step(scan_id, "FORECAST_72H", 9, "running")
        center_lat = (bbox["north"] + bbox["south"]) / 2
        center_lon = (bbox["east"] + bbox["west"]) / 2
        weather = fetch_openmeteo_forecast(center_lat, center_lon)

        ndwi_trend_slope = compute_ndwi_trend([float(np.mean(ndwi_before)), float(np.mean(ndwi_after))])
        forecast_score, forecast_rec = compute_forecast_score(ndwi_trend_slope, weather["total_rainfall_mm"])

        drought_traj = compute_drought_trajectory(
            [drought_info["nddi_mean"] * 0.8, drought_info["nddi_mean"]],
            temp_anomaly=weather.get("avg_temp_c", 25) - 25,
        )

        # Update risk with forecast
        risk_result_final = classify_risk(
            flood_area_km2=final_flood_area,
            confidence=final_confidence,
            pop_affected=pop_affected,
            ndwi_mean=final_ndwi_mean,
            hospitals_at_risk=risk_counts["hospitals_at_risk"],
            forecast_score=forecast_score,
        )

        await db.complete_log_step(lid, output_summary={
            "forecast_score": forecast_score,
            "recommendation": forecast_rec,
            "rainfall_72h_mm": round(weather["total_rainfall_mm"], 1),
            "ndwi_trend_slope": round(ndwi_trend_slope, 6),
            "drought_trajectory": drought_traj["trajectory"],
        })

        # ── Step 10: REPORT GENERATION ─────────────────────────
        lid = await db.log_step(scan_id, "REPORT_GENERATION", 10, "running")
        processing_ms = int((time.time() - pipeline_start) * 1000)

        # Update scan record with all results
        await db.update_scan_results(
            scan_id,
            flood_area_km2=round(final_flood_area, 2),
            change_area_km2=round(change_area_km2, 2),
            risk_level=risk_result_final["risk_level"],
            risk_score=risk_result_final["risk_score"],
            confidence=round(final_confidence, 3),
            confidence_lower=conf_lower,
            confidence_upper=conf_upper,
            pop_affected=pop_affected,
            hospitals_at_risk=risk_counts["hospitals_at_risk"],
            roads_km_affected=round(risk_counts["roads_km_affected"], 1),
            forecast_score=forecast_score,
            forecast_rec=forecast_rec,
            drought_nddi=round(drought_info["nddi_mean"], 4),
            drought_severity=drought_info["severity"],
            drought_area_km2=round(drought_info["drought_area_km2"], 2),
            processing_ms=processing_ms,
            infrastructure_json=json.dumps(infra_serializable),
            status="completed",
        )

        await db.complete_log_step(lid, output_summary={
            "processing_ms": processing_ms,
            "status": "completed",
            "risk_level": risk_result_final["risk_level"],
            "risk_score": risk_result_final["risk_score"],
        })

    except Exception as e:
        await db.update_scan_status(scan_id, "failed")
        # Try to log the failure
        try:
            lid = await db.log_step(scan_id, "PIPELINE_ERROR", 99, "failed")
            await db.complete_log_step(lid, error=str(e))
        except Exception:
            pass
        raise
