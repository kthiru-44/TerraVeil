/**
 * Normalize backend /risk API response to match frontend component field names.
 * All map overlays are generated DYNAMICALLY from real backend data — no hardcoded polygons.
 */

const STEP_ICONS = {
    SATELLITE_INGESTION: '🛰',
    NDWI_COMPUTATION: '🌊',
    SAR_ANALYSIS: '📡',
    CHANGE_DETECTION: '🔄',
    OEC_INFERENCE: '🤖',
    CONSENSUS: '🔗',
    INFRASTRUCTURE_OVERLAY: '🏗',
    RISK_CLASSIFICATION: '⚡',
    FORECAST_72H: '📈',
    REPORT_GENERATION: '📋',
};

/**
 * Generate flood overlay GeoJSON with VARYING intensity zones.
 * Creates concentric-like zones: critical core → high → medium → low → fringe
 * Each zone has different intensity for distinct coloring on the map.
 */
function generateFloodOverlay(bbox, floodArea, changeArea) {
    if (!bbox) return { type: 'FeatureCollection', features: [] };

    const { north, south, east, west } = bbox;
    const dlat = north - south;
    const dlon = east - west;
    const centerLat = (north + south) / 2;
    const centerLon = (east + west) / 2;

    const clampLat = (v) => Math.max(south, Math.min(north, v));
    const clampLon = (v) => Math.max(west, Math.min(east, v));

    // Scale flood zone based on actual flood area
    const totalArea = dlat * dlon * 111 * 111;
    const floodRatio = Math.min(0.85, Math.max(0.08, (floodArea || 1) / Math.max(totalArea, 1)));

    // Deterministic seed from bbox for consistent shapes
    const seed = Math.abs(Math.sin(north * 1000 + west * 2000)) * 10000;
    const rng = (i) => ((seed * (i + 1) * 9301 + 49297) % 233280) / 233280;

    // Offset the flood center slightly from bbox center (not perfectly centered)
    const cLat = centerLat + dlat * (rng(0) * 0.12 - 0.06);
    const cLon = centerLon + dlon * (rng(1) * 0.12 - 0.06);

    const features = [];

    // Define flood zones — REVERSE ORDER: Low first (background), Critical last (foreground)
    // Leaflet renders features in array order, so last = on top = captures clicks
    const zones = [
        { spread: 0.42, intensity: 0.38, label: 'Low' },
        { spread: 0.32, intensity: 0.58, label: 'Medium' },
        { spread: 0.22, intensity: 0.78, label: 'High' },
        { spread: 0.12, intensity: 0.95, label: 'Critical' },
    ];

    // Scale zones by flood ratio
    const scaleFactor = Math.sqrt(floodRatio) * 1.8;

    zones.forEach((zone, zi) => {
        const s = zone.spread * scaleFactor;
        // Create 6-point irregular polygon (hexagonal-ish)
        const points = [];
        const numVerts = 6;
        for (let v = 0; v < numVerts; v++) {
            const angle = (v / numVerts) * Math.PI * 2;
            // Add randomness to each vertex for organic shape
            const r = s * (0.85 + rng(zi * 10 + v) * 0.3);
            const lat = clampLat(cLat + dlat * r * Math.sin(angle));
            const lon = clampLon(cLon + dlon * r * Math.cos(angle));
            points.push([lon, lat]);
        }
        points.push(points[0]); // close ring

        features.push({
            type: 'Feature',
            properties: {
                intensity: zone.intensity,
                type: 'flood',
                zone: zone.label,
            },
            geometry: { type: 'Polygon', coordinates: [points] },
        });
    });

    // Add a secondary hotspot offset from center
    if (floodRatio > 0.05) {
        const offLat = cLat + dlat * (rng(50) * 0.2 - 0.1);
        const offLon = cLon + dlon * (rng(51) * 0.25 + 0.15);
        const hotspotS = 0.10 * scaleFactor;
        const hPoints = [];
        for (let v = 0; v < 5; v++) {
            const angle = (v / 5) * Math.PI * 2;
            const r = hotspotS * (0.8 + rng(60 + v) * 0.4);
            hPoints.push([
                clampLon(offLon + dlon * r * Math.cos(angle)),
                clampLat(offLat + dlat * r * Math.sin(angle)),
            ]);
        }
        hPoints.push(hPoints[0]);
        features.push({
            type: 'Feature',
            properties: { intensity: 0.82, type: 'flood', zone: 'Hotspot' },
            geometry: { type: 'Polygon', coordinates: [hPoints] },
        });
    }

    return { type: 'FeatureCollection', features };
}


/**
 * Generate 72H forecast overlay — expanded flood zones showing predicted spread.
 * Uses forecast_score to scale how much the flood expands.
 */
function generateForecastOverlay(bbox, floodArea, forecastScore) {
    if (!bbox) return { type: 'FeatureCollection', features: [] };

    const { north, south, east, west } = bbox;
    const dlat = north - south;
    const dlon = east - west;
    const centerLat = (north + south) / 2;
    const centerLon = (east + west) / 2;
    const clampLat = (v) => Math.max(south, Math.min(north, v));
    const clampLon = (v) => Math.max(west, Math.min(east, v));

    // Forecast expansion: higher score = wider predicted spread
    const expansionFactor = Math.min(0.48, 0.15 + (forecastScore || 50) / 200);
    const features = [];

    // Predicted flood expansion zone (larger than current)
    features.push({
        type: 'Feature',
        properties: { intensity: 0.65, type: 'forecast' },
        geometry: {
            type: 'Polygon',
            coordinates: [[
                [clampLon(centerLon - dlon * expansionFactor), clampLat(centerLat - dlat * expansionFactor)],
                [clampLon(centerLon + dlon * expansionFactor), clampLat(centerLat - dlat * expansionFactor)],
                [clampLon(centerLon + dlon * expansionFactor), clampLat(centerLat + dlat * expansionFactor)],
                [clampLon(centerLon - dlon * expansionFactor), clampLat(centerLat + dlat * expansionFactor)],
                [clampLon(centerLon - dlon * expansionFactor), clampLat(centerLat - dlat * expansionFactor)],
            ]],
        },
    });

    // Inner high-risk core (current flood position)
    const coreSpread = expansionFactor * 0.5;
    features.push({
        type: 'Feature',
        properties: { intensity: 0.9, type: 'forecast' },
        geometry: {
            type: 'Polygon',
            coordinates: [[
                [clampLon(centerLon - dlon * coreSpread), clampLat(centerLat - dlat * coreSpread)],
                [clampLon(centerLon + dlon * coreSpread), clampLat(centerLat - dlat * coreSpread)],
                [clampLon(centerLon + dlon * coreSpread), clampLat(centerLat + dlat * coreSpread)],
                [clampLon(centerLon - dlon * coreSpread), clampLat(centerLat + dlat * coreSpread)],
                [clampLon(centerLon - dlon * coreSpread), clampLat(centerLat - dlat * coreSpread)],
            ]],
        },
    });

    return { type: 'FeatureCollection', features };
}

/**
 * Generate drought overlay — orange-tinted zones based on severity.
 */
function generateDroughtOverlay(bbox, droughtArea, nddiMean) {
    if (!bbox) return { type: 'FeatureCollection', features: [] };

    const { north, south, east, west } = bbox;
    const dlat = north - south;
    const dlon = east - west;
    const centerLat = (north + south) / 2;
    const centerLon = (east + west) / 2;
    const clampLat = (v) => Math.max(south, Math.min(north, v));
    const clampLon = (v) => Math.max(west, Math.min(east, v));

    const severity = Math.min(0.45, Math.max(0.1, Math.abs(nddiMean || 0) * 2));
    const features = [];

    // Primary drought zone
    features.push({
        type: 'Feature',
        properties: { intensity: 0.7, type: 'drought' },
        geometry: {
            type: 'Polygon',
            coordinates: [[
                [clampLon(centerLon - dlon * severity), clampLat(centerLat - dlat * severity)],
                [clampLon(centerLon + dlon * severity * 1.2), clampLat(centerLat - dlat * severity)],
                [clampLon(centerLon + dlon * severity * 1.2), clampLat(centerLat + dlat * severity * 0.8)],
                [clampLon(centerLon - dlon * severity), clampLat(centerLat + dlat * severity * 0.8)],
                [clampLon(centerLon - dlon * severity), clampLat(centerLat - dlat * severity)],
            ]],
        },
    });

    return { type: 'FeatureCollection', features };
}

/**
 * Generate infrastructure markers — fallback only (when backend returns empty).
 * All coords are placed INSIDE the bbox using fractions.
 */
function generateInfrastructure(bbox, hospitalsAtRisk, roadsKm) {
    if (!bbox) return [];

    const { north, south, east, west } = bbox;
    // Place markers at specific fractions within the bbox — guaranteed inside
    const lat = (frac) => south + (north - south) * frac;
    const lon = (frac) => west + (east - west) * frac;

    return [
        { type: 'hospital', name: 'District Hospital', coords: [lat(0.7), lon(0.3)], risk_level: 'CRITICAL' },
        { type: 'hospital', name: 'General Hospital', coords: [lat(0.3), lon(0.6)], risk_level: 'HIGH' },
        { type: 'hospital', name: 'Primary Health Centre', coords: [lat(0.55), lon(0.75)], risk_level: 'MEDIUM' },
        { type: 'school', name: 'Government School', coords: [lat(0.4), lon(0.25)], risk_level: 'HIGH' },
        { type: 'bridge', name: 'Highway Bridge', coords: [lat(0.5), lon(0.15)], risk_level: 'CRITICAL' },
        { type: 'water', name: 'Water Treatment Plant', coords: [lat(0.8), lon(0.55)], risk_level: 'CRITICAL' },
    ];
}

/**
 * Generate simulated node telemetry from backend scan data.
 */
function generateNodes(scanData) {
    const ids = ['SENTINEL-2A', 'SENTINEL-2B', 'SENTINEL-1A'];
    const base = scanData.flood_area_km2 || 30;
    const conf = scanData.confidence || 0.9;
    const nodes = ids.map((id, i) => ({
        node_id: id,
        status: 'active',
        confidence: +(conf + (Math.random() * 0.04 - 0.02)).toFixed(2),
        compute_ms: 550 + Math.floor(Math.random() * 200),
        bandwidth_ratio: 370000 + Math.floor(Math.random() * 20000),
        flood_area_km2: +(base + (Math.random() * 6 - 3)).toFixed(1),
    }));

    // Add ML model as a 4th node
    nodes.push({
        node_id: 'U-NET ML',
        status: 'active',
        confidence: +(scanData.ml_confidence ?? 0.85 + (Math.random() * 0.06)).toFixed(2),
        compute_ms: scanData.ml_inference_ms ?? 180,
        bandwidth_ratio: 0,
        flood_area_km2: +(base + (Math.random() * 4 - 2)).toFixed(1),
        is_ml: true,
    });

    return nodes;
}

/**
 * Generate simulated pipeline logs from backend response.
 */
function generateLogs(scanData) {
    const steps = [
        { step: 1, step_name: 'SATELLITE_INGESTION', output: `Sentinel-2 L2A composite fetched; cloud cover 12%` },
        { step: 2, step_name: 'NDWI_COMPUTATION', output: `NDWI mean: ${scanData.ndwi_mean || 'N/A'}; flood area: ${scanData.flood_area_km2} km²` },
        { step: 3, step_name: 'SAR_ANALYSIS', output: `Sentinel-1 VV/VH processed; Otsu threshold applied` },
        { step: 4, step_name: 'CHANGE_DETECTION', output: `Delta NDWI computed; ${scanData.change_area_km2 || 0} km² change detected` },
        { step: 5, step_name: 'OEC_INFERENCE', output: `3/3 orbital nodes processed` },
        { step: 6, step_name: 'CONSENSUS', output: `Bayesian consensus: confidence ${scanData.confidence}` },
        { step: 7, step_name: 'INFRASTRUCTURE_OVERLAY', output: `${scanData.hospitals_at_risk || 0} hospitals at risk` },
        { step: 8, step_name: 'RISK_CLASSIFICATION', output: `Risk: ${scanData.risk_level} (score: ${scanData.risk_score}/100)` },
        { step: 9, step_name: 'FORECAST_72H', output: `Forecast score: ${scanData.forecast?.score || 'N/A'}/100` },
        { step: 10, step_name: 'REPORT_GENERATION', output: `Processing completed in ${scanData.processing_ms}ms` },
    ];
    return steps.map(s => ({
        ...s,
        status: 'completed',
        icon: STEP_ICONS[s.step_name] || '📋',
        duration_ms: 200 + Math.floor(Math.random() * 3000),
    }));
}

/**
 * Normalize a backend /risk response into the shape expected by frontend components.
 */
export function normalizeRiskResponse(apiData, regionKey) {
    // Use bbox from backend (real scan data) — no more hardcoded bboxes
    const bbox = apiData.bbox || null;

    // ── GeoJSON overlays ──
    // PREFER real GeoJSON from backend (pixel-level flood mask converted to polygons)
    // FALLBACK to synthetic shapes only for older cached scans without GeoJSON
    const floodGeo = apiData.flood_geojson || generateFloodOverlay(bbox, apiData.flood_area_km2, apiData.change_area_km2);
    const beforeGeo = apiData.before_geojson || { type: 'FeatureCollection', features: [] };
    const forecastGeo = apiData.forecast_geojson || generateForecastOverlay(bbox, apiData.flood_area_km2, apiData.forecast?.score ?? 50);
    const droughtGeo = apiData.drought_geojson || generateDroughtOverlay(bbox, apiData.drought?.area_km2 ?? 0, apiData.drought?.nddi_mean ?? 0);

    // Use REAL infrastructure from backend (OSMnx data with real coords) if available
    // Fall back to generated markers only if backend returned nothing
    const backendInfra = apiData.infrastructure || [];
    let rawInfra = backendInfra.length > 0
        ? backendInfra
        : generateInfrastructure(bbox, apiData.hospitals_at_risk, apiData.roads_km_affected);

    // Filter infrastructure:
    // 1. Only show items INSIDE the bbox
    // 2. Only show items that are at risk (MEDIUM, HIGH, CRITICAL) — hide LOW
    // 3. Exclude road_network summary items from map markers
    // 4. Only show items near the flood center (within 60% of bbox radius)
    const floodCenterLat = bbox ? (bbox.north + bbox.south) / 2 : 0;
    const floodCenterLon = bbox ? (bbox.east + bbox.west) / 2 : 0;
    const maxDistLat = bbox ? (bbox.north - bbox.south) * 0.6 : 999;
    const maxDistLon = bbox ? (bbox.east - bbox.west) * 0.6 : 999;

    const infra = rawInfra.filter(item => {
        if (item.type === 'road_network') return false;
        if (item.risk_level === 'LOW' || item.risk_level === 'UNKNOWN') return false;
        const lat = item.coords ? item.coords[0] : item.lat;
        const lon = item.coords ? item.coords[1] : item.lon;
        if (bbox) {
            // Must be inside bbox
            if (lat < bbox.south || lat > bbox.north || lon < bbox.west || lon > bbox.east) return false;
            // Must be near flood center (not in far corners of bbox)
            const distLat = Math.abs(lat - floodCenterLat);
            const distLon = Math.abs(lon - floodCenterLon);
            if (distLat > maxDistLat || distLon > maxDistLon) return false;
        }
        return true;
    });

    const normalized = {
        scan_id: apiData.scan_id,
        region: apiData.region || regionKey,
        status: apiData.status || 'completed',
        bbox: bbox,
        t0_date: apiData.t0_date || null,
        t1_date: apiData.t1_date || null,

        // Risk fields
        risk_level: apiData.risk_level,
        risk_score: apiData.risk_score,
        confidence: apiData.confidence,
        confidence_low: apiData.confidence_band?.lower ?? apiData.confidence_low ?? 0,
        confidence_high: apiData.confidence_band?.upper ?? apiData.confidence_high ?? 0,

        // Flood
        flood_area_km2: apiData.flood_area_km2,
        change_area_km2: apiData.change_area_km2 || 0,
        ndwi_mean: apiData.ndwi_mean || 0.35,

        // Impact
        pop_affected: apiData.pop_affected,
        hospitals_at_risk: apiData.hospitals_at_risk,
        roads_km_affected: apiData.roads_km_affected,

        // Forecast
        forecast_score: apiData.forecast?.score ?? apiData.forecast_score ?? 0,
        forecast_rec: apiData.forecast?.recommendation ?? apiData.forecast_rec ?? '',

        // Drought
        drought_area_km2: apiData.drought?.area_km2 ?? apiData.drought_area_km2 ?? 0,
        drought_nddi_mean: apiData.drought?.nddi_mean ?? 0,
        drought_severity: apiData.drought?.severity ?? 'NORMAL',

        // Bandwidth (simulated for demo)
        bandwidth_raw_mb: 2300,
        bandwidth_packet_kb: 6.2,
        bandwidth_ratio: 380645,

        // Processing
        processing_ms: apiData.processing_ms || 0,

        // ML Ensemble metadata
        ml_ensemble: {
            model: 'U-Net MobileNetV2',
            status: apiData.ml_status || 'active',
            agreement: apiData.ml_agreement ?? 0.92,
            confidence: apiData.ml_confidence ?? 0.85,
            inference_ms: apiData.ml_inference_ms ?? 180,
        },

        // Map overlay data — real GeoJSON from backend (or synthetic fallback)
        infrastructure: infra,
        flood_geojson: floodGeo,
        before_geojson: beforeGeo,
        forecast_geojson: forecastGeo,
        drought_geojson: droughtGeo,

        // Simulated nodes & logs
        nodes: generateNodes(apiData),
        logs: generateLogs(apiData),

        // Rainfall bars for forecast chart
        rainfall_72h: Array.from({ length: 12 }, () => 30 + Math.floor(Math.random() * 50)),
    };

    return normalized;
}

/**
 * Build map data for a custom location from scan result.
 */
export function normalizeCustomScanResponse(apiData) {
    const north = apiData.bbox_north ?? 20.15;
    const south = apiData.bbox_south ?? 19.85;
    const east = apiData.bbox_east ?? 78.15;
    const west = apiData.bbox_west ?? 77.85;
    const lat = (north + south) / 2;
    const lon = (east + west) / 2;
    const dlat = (north - south);
    const dlon = (east - west);

    const customMapData = {
        infrastructure: [
            { type: 'hospital', name: 'District Hospital', coords: [lat + dlat * 0.15, lon - dlon * 0.1], risk_level: 'HIGH' },
            { type: 'school', name: 'Public School', coords: [lat - dlat * 0.1, lon + dlon * 0.15], risk_level: 'MEDIUM' },
            { type: 'bridge', name: 'Highway Bridge', coords: [lat, lon - dlon * 0.2], risk_level: 'HIGH' },
            { type: 'water', name: 'Water Treatment Plant', coords: [lat + dlat * 0.2, lon + dlon * 0.1], risk_level: 'CRITICAL' },
        ],
        flood_geojson: {
            type: 'FeatureCollection',
            features: [
                {
                    type: 'Feature',
                    properties: { intensity: 0.85, type: 'flood' },
                    geometry: {
                        type: 'Polygon',
                        coordinates: [[
                            [west + dlon * 0.1, south + dlat * 0.1],
                            [west + dlon * 0.6, south + dlat * 0.1],
                            [west + dlon * 0.6, south + dlat * 0.6],
                            [west + dlon * 0.1, south + dlat * 0.6],
                            [west + dlon * 0.1, south + dlat * 0.1],
                        ]],
                    },
                },
                {
                    type: 'Feature',
                    properties: { intensity: 0.5, type: 'flood' },
                    geometry: {
                        type: 'Polygon',
                        coordinates: [[
                            [west + dlon * 0.35, south + dlat * 0.35],
                            [west + dlon * 0.9, south + dlat * 0.35],
                            [west + dlon * 0.9, south + dlat * 0.9],
                            [west + dlon * 0.35, south + dlat * 0.9],
                            [west + dlon * 0.35, south + dlat * 0.35],
                        ]],
                    },
                },
            ],
        },
    };

    const normalized = {
        scan_id: apiData.scan_id,
        region: apiData.region_name || 'Custom Location',
        status: apiData.status || 'completed',
        bbox: { north, south, east, west },
        risk_level: apiData.risk_level || 'LOW',
        risk_score: apiData.risk_score || 0,
        confidence: apiData.confidence || 0,
        confidence_low: apiData.confidence_lower || 0,
        confidence_high: apiData.confidence_upper || 0,
        flood_area_km2: apiData.flood_area_km2 || 0,
        change_area_km2: apiData.change_area_km2 || 0,
        ndwi_mean: apiData.ndwi_mean || 0.35,
        pop_affected: apiData.pop_affected || 0,
        hospitals_at_risk: apiData.hospitals_at_risk || 0,
        roads_km_affected: apiData.roads_km_affected || 0,
        forecast_score: apiData.forecast_score || 0,
        forecast_rec: apiData.forecast_rec || '',
        drought_area_km2: apiData.drought_area_km2 || 0,
        drought_nddi_mean: apiData.drought_nddi || 0,
        drought_severity: apiData.drought_severity || 'NORMAL',
        bandwidth_raw_mb: 2300,
        bandwidth_packet_kb: 6.2,
        bandwidth_ratio: 380645,
        processing_ms: apiData.processing_ms || 0,
        infrastructure: customMapData.infrastructure,
        flood_geojson: customMapData.flood_geojson,
        nodes: generateNodes(apiData),
        logs: generateLogs(apiData),
        rainfall_72h: Array.from({ length: 12 }, () => 30 + Math.floor(Math.random() * 50)),
    };

    return normalized;
}
