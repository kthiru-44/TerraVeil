"""Multi-node Bayesian consensus protocol for OEC inference packets."""

import numpy as np
from app.orbital.inference_packet import InferencePacketData
from app.core.constants import (
    CONFIDENCE_3_OF_3, CONFIDENCE_2_OF_3,
    MIN_NODES_FOR_CONSENSUS, REDUCED_CONFIDENCE_PENALTY,
)


def run_consensus(packets: list[InferencePacketData]) -> dict:
    """
    Run Bayesian consensus on inference packets from OEC nodes.

    Rules:
        - 3/3 nodes detect → confidence 0.97
        - 2/3 nodes detect → confidence 0.87
        - 1/3 → flag as uncertain
        - < 2 valid nodes → INSUFFICIENT_DATA

    Consensus flood area = weighted mean of node estimates by confidence.
    Confidence interval = ±(std_dev of confidences × 1.5)

    Returns dict with consensus results.
    """
    valid_packets = [p for p in packets if p.is_valid]
    total_nodes = len(packets)
    responding_nodes = len(valid_packets)

    # Insufficient data check
    if responding_nodes < MIN_NODES_FOR_CONSENSUS:
        return {
            "status": "INSUFFICIENT_DATA",
            "nodes_responded": responding_nodes,
            "total_nodes": total_nodes,
            "flood_area_km2": 0.0,
            "confidence": 0.0,
            "confidence_lower": 0.0,
            "confidence_upper": 0.0,
            "ndwi_mean": 0.0,
            "reduced_confidence": True,
            "consensus_method": "bayesian_weighted",
            "bandwidth_ratio_total": 0.0,
        }

    # Count nodes detecting flood
    flood_detecting = [p for p in valid_packets if p.flood_detected]
    n_detecting = len(flood_detecting)

    # Bayesian confidence based on node agreement
    if n_detecting == total_nodes and total_nodes == 3:
        base_confidence = CONFIDENCE_3_OF_3  # 0.97
    elif n_detecting >= 2:
        base_confidence = CONFIDENCE_2_OF_3  # 0.87
    elif n_detecting == 1:
        base_confidence = 0.55  # uncertain
    else:
        base_confidence = 0.20  # no detection

    # Reduced confidence if not all nodes responded
    reduced = responding_nodes < total_nodes
    if reduced:
        base_confidence -= REDUCED_CONFIDENCE_PENALTY

    # Weighted mean flood area (weighted by individual node confidence)
    confidences = np.array([p.confidence for p in valid_packets])
    flood_areas = np.array([p.flood_area_km2 for p in valid_packets])
    ndwi_means = np.array([p.ndwi_mean for p in valid_packets])

    weights = confidences / confidences.sum() if confidences.sum() > 0 else np.ones(len(confidences)) / len(confidences)
    consensus_flood_area = float(np.average(flood_areas, weights=weights))
    consensus_ndwi_mean = float(np.average(ndwi_means, weights=weights))

    # Confidence interval: ±(std_dev × 1.5)
    conf_std = float(np.std(confidences)) if len(confidences) > 1 else 0.03
    margin = conf_std * 1.5
    confidence_lower = round(max(0, base_confidence - margin), 3)
    confidence_upper = round(min(1, base_confidence + margin), 3)

    # Total bandwidth reduction
    total_raw_mb = sum(p.raw_data_mb for p in valid_packets)
    total_packet_kb = sum(p.packet_kb for p in valid_packets)
    bandwidth_ratio = (total_raw_mb * 1024) / total_packet_kb if total_packet_kb > 0 else 0

    return {
        "status": "CONSENSUS_REACHED",
        "nodes_responded": responding_nodes,
        "total_nodes": total_nodes,
        "nodes_detecting_flood": n_detecting,
        "flood_area_km2": round(consensus_flood_area, 2),
        "confidence": round(base_confidence, 3),
        "confidence_lower": confidence_lower,
        "confidence_upper": confidence_upper,
        "ndwi_mean": round(consensus_ndwi_mean, 4),
        "reduced_confidence": reduced,
        "consensus_method": "bayesian_weighted",
        "bandwidth_ratio_total": round(bandwidth_ratio, 1),
        "node_details": [p.to_dict() for p in valid_packets],
    }
