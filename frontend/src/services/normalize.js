/**
 * Normalize backend /risk API response to match frontend component field names.
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

/* Region-specific demo infrastructure & GeoJSON for map overlays */
const REGION_MAP_DATA = {
    kolhapur: {
        infrastructure: [
            { type: 'hospital', name: 'Civil Hospital Kolhapur', coords: [16.705, 74.224], risk_level: 'HIGH' },
            { type: 'hospital', name: 'Shahu Hospital', coords: [16.695, 74.240], risk_level: 'CRITICAL' },
            { type: 'hospital', name: 'Govt. Medical College', coords: [16.715, 74.210], risk_level: 'MEDIUM' },
            { type: 'school', name: 'DY Patil School', coords: [16.680, 74.250], risk_level: 'HIGH' },
            { type: 'bridge', name: 'Panchganga Bridge', coords: [16.700, 74.230], risk_level: 'CRITICAL' },
            { type: 'water', name: 'Kalamba Water Works', coords: [16.670, 74.245], risk_level: 'HIGH' },
        ],
        flood_geojson: {
            type: 'FeatureCollection',
            features: [
                { type: 'Feature', properties: { intensity: 0.9, type: 'flood' }, geometry: { type: 'Polygon', coordinates: [[[74.15, 16.65], [74.30, 16.65], [74.30, 16.75], [74.15, 16.75], [74.15, 16.65]]] } },
                { type: 'Feature', properties: { intensity: 0.6, type: 'flood' }, geometry: { type: 'Polygon', coordinates: [[[74.10, 16.70], [74.25, 16.70], [74.25, 16.80], [74.10, 16.80], [74.10, 16.70]]] } },
            ],
        },
    },
    chennai: {
        infrastructure: [
            { type: 'hospital', name: 'Government General Hospital', coords: [13.06, 80.28], risk_level: 'CRITICAL' },
            { type: 'hospital', name: 'Rajiv Gandhi Hospital', coords: [13.08, 80.27], risk_level: 'HIGH' },
            { type: 'school', name: 'Presidency College', coords: [13.07, 80.26], risk_level: 'MEDIUM' },
            { type: 'bridge', name: 'Napier Bridge', coords: [13.05, 80.29], risk_level: 'HIGH' },
            { type: 'water', name: 'Kilpauk Water Works', coords: [13.09, 80.25], risk_level: 'HIGH' },
        ],
        flood_geojson: {
            type: 'FeatureCollection',
            features: [
                { type: 'Feature', properties: { intensity: 0.85, type: 'flood' }, geometry: { type: 'Polygon', coordinates: [[[80.15, 12.95], [80.30, 12.95], [80.30, 13.10], [80.15, 13.10], [80.15, 12.95]]] } },
                { type: 'Feature', properties: { intensity: 0.5, type: 'flood' }, geometry: { type: 'Polygon', coordinates: [[[80.22, 13.00], [80.35, 13.00], [80.35, 13.15], [80.22, 13.15], [80.22, 13.00]]] } },
            ],
        },
    },
    pakistan: {
        infrastructure: [
            { type: 'hospital', name: 'Civil Hospital Hyderabad', coords: [25.38, 68.37], risk_level: 'CRITICAL' },
            { type: 'hospital', name: 'Liaquat University Hospital', coords: [25.40, 68.35], risk_level: 'HIGH' },
            { type: 'school', name: 'Sindh University', coords: [25.42, 68.36], risk_level: 'HIGH' },
            { type: 'bridge', name: 'Indus Bridge', coords: [25.37, 68.38], risk_level: 'CRITICAL' },
            { type: 'water', name: 'Sukkur Water Treatment', coords: [25.45, 68.34], risk_level: 'HIGH' },
        ],
        flood_geojson: {
            type: 'FeatureCollection',
            features: [
                { type: 'Feature', properties: { intensity: 0.95, type: 'flood' }, geometry: { type: 'Polygon', coordinates: [[[68.20, 26.55], [68.50, 26.55], [68.50, 26.90], [68.20, 26.90], [68.20, 26.55]]] } },
                { type: 'Feature', properties: { intensity: 0.7, type: 'flood' }, geometry: { type: 'Polygon', coordinates: [[[68.15, 26.60], [68.40, 26.60], [68.40, 26.80], [68.15, 26.80], [68.15, 26.60]]] } },
            ],
        },
    },
};

/**
 * Generate simulated node telemetry from backend scan data.
 */
function generateNodes(scanData) {
    const ids = ['COSMEON-LEO-07', 'COSMEON-LEO-11', 'COSMEON-LEO-14'];
    const base = scanData.flood_area_km2 || 30;
    const conf = scanData.confidence || 0.9;
    return ids.map((id, i) => ({
        node_id: id,
        status: 'active',
        confidence: +(conf + (Math.random() * 0.04 - 0.02)).toFixed(2),
        compute_ms: 550 + Math.floor(Math.random() * 200),
        bandwidth_ratio: 370000 + Math.floor(Math.random() * 20000),
        flood_area_km2: +(base + (Math.random() * 6 - 3)).toFixed(1),
    }));
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
    const EMPTY_MAP = { infrastructure: [], flood_geojson: { type: 'FeatureCollection', features: [] } };
    const mapData = REGION_MAP_DATA[regionKey] || EMPTY_MAP;

    /* Import bbox from REGION_PRESETS for map centering */
    const REGION_BBOXES = {
        kolhapur: { north: 16.9, south: 16.5, east: 74.4, west: 74.0 },
        chennai: { north: 13.2, south: 12.8, east: 80.4, west: 80.0 },
        pakistan: { north: 26.5, south: 25.0, east: 68.5, west: 67.5 },
    };

    const normalized = {
        scan_id: apiData.scan_id,
        region: apiData.region || regionKey,
        status: apiData.status || 'completed',
        bbox: REGION_BBOXES[regionKey] || null,

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

        // Map overlay data
        infrastructure: mapData.infrastructure,
        flood_geojson: mapData.flood_geojson,

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
