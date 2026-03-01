import { useState, useMemo, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import MapPanel from '../map/MapPanel.jsx';
import FloodOverlay from '../map/FloodOverlay.jsx';
import InfrastructureMarkers from '../map/InfrastructureMarkers.jsx';
import RiskCard from './RiskCard.jsx';
import StatsBar from './StatsBar.jsx';
import BandwidthCounter from './BandwidthCounter.jsx';
import NodeTelemetry from '../nodes/NodeTelemetry.jsx';
import ConsensusResult from '../nodes/ConsensusResult.jsx';
import LogPanel from '../logs/LogPanel.jsx';
import ForecastToggle from '../forecast/ForecastToggle.jsx';
import { generateReport } from '../../services/reportGenerator.js';
import './Dashboard.css';

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.06, delayChildren: 0.1 },
    },
};

const itemVariants = {
    hidden: { opacity: 0, y: 16 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } },
};

export default function Dashboard({ user, scanData, setScanData, scanConfig, regionPresets, onNewScan }) {
    const [viewMode, setViewMode] = useState('now');
    const [exporting, setExporting] = useState(false);
    const mapRef = useRef(null);

    const handleExport = useCallback(async () => {
        setExporting(true);
        try {
            const reportData = {
                ...scanData,
                region: scanConfig?.region || scanConfig?.selectedRegion || 'Unknown',
                period: scanConfig?.date_start ? `${scanConfig.date_start} -> ${scanConfig.date_end}` : '',
                bbox: {
                    north: scanConfig?.north || scanData.bbox_north,
                    south: scanConfig?.south || scanData.bbox_south,
                    east: scanConfig?.east || scanData.bbox_east,
                    west: scanConfig?.west || scanData.bbox_west,
                },
            };
            const mapEl = mapRef.current?.querySelector('.leaflet-container') || mapRef.current;
            await generateReport(reportData, mapEl);
        } catch (err) {
            console.error('Report generation failed:', err);
        } finally {
            setExporting(false);
        }
    }, [scanData, scanConfig]);

    const regionKey = scanConfig?.selectedRegion || 'kolhapur';
    const region = regionPresets?.[regionKey];
    const mapCenter = scanConfig?.center || region?.center || [16.7, 74.2];

    // Compute map bounds from bbox for auto-fit
    const mapBounds = useMemo(() => {
        const bbox = scanData?.bbox;
        if (bbox && bbox.north && bbox.south && bbox.east && bbox.west) {
            return [[bbox.south, bbox.west], [bbox.north, bbox.east]];
        }
        return null;
    }, [scanData?.bbox]);

    // Pick the right GeoJSON overlay for the active view mode
    const activeGeoJson = useMemo(() => {
        switch (viewMode) {
            case 'before': return scanData.before_geojson || { type: 'FeatureCollection', features: [] };
            case 'now': return scanData.flood_geojson;
            case 'forecast': return scanData.forecast_geojson || scanData.flood_geojson;
            case 'drought': return scanData.drought_geojson || scanData.flood_geojson;
            default: return scanData.flood_geojson;
        }
    }, [viewMode, scanData]);

    // Section title changes per mode
    const sectionTitle = viewMode === 'before' ? 'Baseline (Pre-Event)'
        : viewMode === 'forecast' ? '72H Forecast Projection'
            : viewMode === 'drought' ? 'Drought Severity Zone'
                : 'Analysis Region';

    return (
        <motion.div className="dashboard" variants={containerVariants} initial="hidden" animate="visible">
            <div className="dashboard-body">

                {/* ── Map ── */}
                <motion.div className="dashboard-map" variants={itemVariants}>
                    <div className="map-header">
                        <h2 className="section-title">{sectionTitle}</h2>
                        <ForecastToggle viewMode={viewMode} setViewMode={setViewMode} />
                    </div>
                    <div className="map-container" ref={mapRef}>
                        <MapPanel center={mapCenter} zoom={11} bounds={mapBounds} geojson={activeGeoJson}>
                            <FloodOverlay geojson={activeGeoJson} viewMode={viewMode} scanId={scanData.scan_id} />
                            {viewMode !== 'before' && (
                                <InfrastructureMarkers infrastructure={scanData.infrastructure} />
                            )}
                        </MapPanel>
                    </div>
                </motion.div>

                {/* ── Info Panel ── */}
                <div className="dashboard-info">

                    {/* Scan Summary */}
                    <motion.div className="scan-summary glass-card" variants={itemVariants}>
                        <div className="ss-header">
                            <h3 className="panel-title">Scan Results</h3>
                            <div className="ss-actions">
                                <button
                                    className="ss-export-btn"
                                    onClick={handleExport}
                                    disabled={exporting}
                                >
                                    {exporting ? 'Exporting...' : 'EXPORT PDF'}
                                </button>
                                <button className="ss-new-scan" onClick={onNewScan}>
                                    NEW SCAN
                                </button>
                            </div>
                        </div>
                        <div className="ss-meta">
                            <span className="ss-tag">REGION</span>
                            <span className="ss-val">{scanConfig?.region || regionKey}</span>
                        </div>
                        {scanConfig?.date_start && (
                            <div className="ss-meta">
                                <span className="ss-tag">PERIOD</span>
                                <span className="ss-val">{scanConfig.date_start} → {scanConfig.date_end}</span>
                            </div>
                        )}
                    </motion.div>

                    <motion.div variants={itemVariants}>
                        <BandwidthCounter data={scanData} />
                    </motion.div>

                    {/* View-mode-dependent panels */}
                    {viewMode === 'forecast' ? (
                        <motion.div className="forecast-info glass-card" variants={itemVariants}>
                            <h3 className="panel-title">
                                <span className="section-icon"></span>
                                72-Hour Forecast
                            </h3>
                            <div className="forecast-score-row">
                                <span className="forecast-label">Flood Probability</span>
                                <span className="forecast-value" style={{
                                    color: scanData.forecast_score > 60 ? 'var(--color-danger)' :
                                        scanData.forecast_score > 40 ? 'var(--color-warning)' : 'var(--color-success)'
                                }}>
                                    {scanData.forecast_score?.toFixed(0) || 0}%
                                </span>
                            </div>
                            <p className="forecast-rec">{scanData.forecast_rec || 'No recommendation available.'}</p>
                            <div className="forecast-rainfall">
                                <span className="forecast-label">Projected Rainfall (6h intervals)</span>
                                <div className="rainfall-bars">
                                    {(scanData.rainfall_72h || []).map((val, i) => (
                                        <div key={i} className="rainfall-bar-wrap">
                                            <div
                                                className="rainfall-bar"
                                                style={{ height: `${Math.min(100, val)}%` }}
                                                title={`${val} mm`}
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    ) : viewMode === 'before' ? (
                        <motion.div className="before-info glass-card" variants={itemVariants}>
                            <h3 className="panel-title">
                                <span className="section-icon"></span>
                                Baseline State
                            </h3>
                            <p className="before-desc">
                                Pre-event satellite imagery showing the region before flood detection.
                                No flood or change zones detected in baseline period.
                            </p>
                            <div className="before-stats">
                                <div className="b-stat">
                                    <span className="b-stat-label">Period</span>
                                    <span className="b-stat-value">{scanData.t0_date || 'N/A'}</span>
                                </div>
                                <div className="b-stat">
                                    <span className="b-stat-label">Sensor</span>
                                    <span className="b-stat-value">Sentinel-2 Optical</span>
                                </div>
                                <div className="b-stat">
                                    <span className="b-stat-label">NDWI Mean</span>
                                    <span className="b-stat-value">Normal</span>
                                </div>
                            </div>
                        </motion.div>
                    ) : (
                        <>
                            <motion.div variants={itemVariants}>
                                <RiskCard data={scanData} viewMode={viewMode} />
                            </motion.div>
                            <motion.div variants={itemVariants}>
                                <StatsBar data={scanData} />
                            </motion.div>
                        </>
                    )}

                    {viewMode === 'drought' && (
                        <motion.div variants={itemVariants}>
                            <DroughtPanel data={scanData} />
                        </motion.div>
                    )}

                    <motion.div variants={itemVariants}>
                        <ConsensusResult data={scanData} />
                    </motion.div>
                    <motion.div variants={itemVariants}>
                        <NodeTelemetry nodes={scanData.nodes} />
                    </motion.div>
                    <motion.div variants={itemVariants}>
                        <LogPanel logs={scanData.logs} status={scanData.status} />
                    </motion.div>
                </div>
            </div>
        </motion.div>
    );
}

