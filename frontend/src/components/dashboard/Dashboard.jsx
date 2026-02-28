import { useState } from 'react';
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
import DroughtPanel from '../forecast/DroughtPanel.jsx';
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

    const regionKey = scanConfig?.selectedRegion || 'kolhapur';
    const region = regionPresets?.[regionKey];
    const mapCenter = scanConfig?.center || region?.center || [16.7, 74.2];

    return (
        <motion.div className="dashboard" variants={containerVariants} initial="hidden" animate="visible">
            <div className="dashboard-body">

                {/* ── Map ── */}
                <motion.div className="dashboard-map" variants={itemVariants}>
                    <div className="map-header">
                        <h2 className="section-title">Analysis Region</h2>
                        <ForecastToggle viewMode={viewMode} setViewMode={setViewMode} />
                    </div>
                    <div className="map-container">
                        <MapPanel center={mapCenter} zoom={13}>
                            <FloodOverlay geojson={scanData.flood_geojson} viewMode={viewMode} />
                            <InfrastructureMarkers infrastructure={scanData.infrastructure} />
                        </MapPanel>
                    </div>
                </motion.div>

                {/* ── Info Panel ── */}
                <div className="dashboard-info">

                    {/* Scan Summary */}
                    <motion.div className="scan-summary glass-card" variants={itemVariants}>
                        <div className="ss-header">
                            <h3 className="panel-title">Scan Results</h3>
                            <button className="ss-new-scan" onClick={onNewScan}>
                                ↻ NEW SCAN
                            </button>
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
                    <motion.div variants={itemVariants}>
                        <RiskCard data={scanData} viewMode={viewMode} />
                    </motion.div>
                    <motion.div variants={itemVariants}>
                        <StatsBar data={scanData} />
                    </motion.div>

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
