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
import { REGION_PRESETS } from '../../App.jsx';
import { submitScan } from '../../services/api.js';
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

export default function Dashboard({ user, scanData, setScanData, selectedRegion, setSelectedRegion, regionPresets, onLogout }) {
    const [viewMode, setViewMode] = useState('now');
    const [isScanning, setIsScanning] = useState(false);
    const [customLocation, setCustomLocation] = useState('');
    const [customLat, setCustomLat] = useState('');
    const [customLon, setCustomLon] = useState('');
    const [dateStart, setDateStart] = useState('');
    const [dateEnd, setDateEnd] = useState('');
    const [showProfile, setShowProfile] = useState(false);

    const region = regionPresets[selectedRegion];

    const handleRegionChange = (key) => {
        setSelectedRegion(key);
        if (key !== 'custom') {
            setDateStart(regionPresets[key].date_start);
            setDateEnd(regionPresets[key].date_end);
        }
    };

    const handleScan = async () => {
        setIsScanning(true);
        try {
            const isCustom = selectedRegion === 'custom';
            const lat = isCustom ? parseFloat(customLat) : region.center[0];
            const lon = isCustom ? parseFloat(customLon) : region.center[1];
            const payload = {
                region: isCustom ? customLocation : selectedRegion,
                bbox: isCustom ? [lon - 0.2, lat - 0.2, lon + 0.2, lat + 0.2] : region.bbox,
                date_start: dateStart || region.date_start,
                date_end: dateEnd || region.date_end,
                source: 'sentinel2',
            };
            await submitScan(payload);
        } catch (e) {
            // Demo mode
        }
        setTimeout(() => setIsScanning(false), 2000);
    };

    const mapCenter = selectedRegion === 'custom' && customLat && customLon
        ? [parseFloat(customLat), parseFloat(customLon)]
        : region.center;

    return (
        <motion.div className="dashboard" variants={containerVariants} initial="hidden" animate="visible">

            {/* ── Navbar ── */}
            <motion.nav className="nav" variants={itemVariants}>
                <div className="nav-left">
                    <div className="nav-logo-mark">
                        <svg viewBox="0 0 24 24" className="nav-logo-svg">
                            <circle cx="12" cy="12" r="10" fill="none" stroke="rgba(192,192,192,0.2)" strokeWidth="0.5" />
                            <circle cx="12" cy="12" r="2" fill="#fff" />
                            <circle cx="12" cy="2" r="1.2" fill="#c0c0c0" />
                        </svg>
                    </div>
                    <span className="nav-title">TERRAVEIL</span>
                    <span className="nav-divider" />
                    <span className="nav-subtitle">Orbital Edge Intelligence</span>
                </div>
                <div className="nav-center">
                    <BandwidthCounter data={scanData} />
                </div>
                <div className="nav-right">
                    <div className="nav-status">
                        <span className="status-dot" />
                        <span className="status-text">ONLINE</span>
                    </div>
                    <div className="nav-user" onClick={() => setShowProfile(!showProfile)}>
                        <span className="user-avatar">{user?.name?.[0]?.toUpperCase() || 'U'}</span>
                        {showProfile && (
                            <div className="profile-dropdown glass-card-solid">
                                <div className="profile-header">
                                    <span className="profile-avatar-lg">{user?.name?.[0]?.toUpperCase() || 'U'}</span>
                                    <div className="profile-info">
                                        <span className="profile-name">{user?.name || 'Operator'}</span>
                                        <span className="profile-email">{user?.email || 'user@cosmeon.in'}</span>
                                    </div>
                                </div>
                                <div className="profile-divider" />
                                <button className="profile-logout" onClick={(e) => { e.stopPropagation(); onLogout?.(); }}>
                                    <span>⏻</span> LOG OUT
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </motion.nav>

            {/* ── Body ── */}
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
                        {isScanning && <div className="map-scan-line" />}
                    </div>
                </motion.div>

                {/* ── Info Panel ── */}
                <div className="dashboard-info">

                    {/* Scan Controls */}
                    <motion.div className="scan-controls glass-card" variants={itemVariants}>
                        <h3 className="panel-title">Scan Configuration</h3>
                        <div className="scan-form">
                            <div className="form-group">
                                <label className="form-label">REGION</label>
                                <select
                                    className="form-select"
                                    value={selectedRegion}
                                    onChange={(e) => handleRegionChange(e.target.value)}
                                >
                                    {Object.entries(regionPresets).map(([key, val]) => (
                                        <option key={key} value={key}>{val.label}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Custom Location Input */}
                            {selectedRegion === 'custom' && (
                                <motion.div
                                    className="custom-location"
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                >
                                    <div className="form-group">
                                        <label className="form-label">LOCATION NAME</label>
                                        <input
                                            type="text"
                                            className="form-input"
                                            placeholder="e.g. Mumbai, India"
                                            value={customLocation}
                                            onChange={(e) => setCustomLocation(e.target.value)}
                                        />
                                    </div>
                                    <div className="form-row">
                                        <div className="form-group">
                                            <label className="form-label">LATITUDE</label>
                                            <input
                                                type="number"
                                                className="form-input"
                                                placeholder="19.0760"
                                                step="0.0001"
                                                value={customLat}
                                                onChange={(e) => setCustomLat(e.target.value)}
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">LONGITUDE</label>
                                            <input
                                                type="number"
                                                className="form-input"
                                                placeholder="72.8777"
                                                step="0.0001"
                                                value={customLon}
                                                onChange={(e) => setCustomLon(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            <div className="form-row">
                                <div className="form-group">
                                    <label className="form-label">START DATE</label>
                                    <input
                                        type="date"
                                        className="form-input"
                                        value={dateStart || region.date_start}
                                        onChange={(e) => setDateStart(e.target.value)}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">END DATE</label>
                                    <input
                                        type="date"
                                        className="form-input"
                                        value={dateEnd || region.date_end}
                                        onChange={(e) => setDateEnd(e.target.value)}
                                    />
                                </div>
                            </div>

                            <button
                                className={`btn btn-primary scan-btn ${isScanning ? 'scanning' : ''}`}
                                onClick={handleScan}
                                disabled={isScanning}
                            >
                                {isScanning ? (
                                    <span className="scan-loading">
                                        <span className="scan-spinner" />
                                        ANALYZING
                                    </span>
                                ) : (
                                    'LAUNCH SCAN'
                                )}
                            </button>
                        </div>
                    </motion.div>

                    {/* Risk + Stats */}
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

                    {/* Nodes */}
                    <motion.div variants={itemVariants}>
                        <ConsensusResult data={scanData} />
                    </motion.div>
                    <motion.div variants={itemVariants}>
                        <NodeTelemetry nodes={scanData.nodes} />
                    </motion.div>

                    {/* Logs */}
                    <motion.div variants={itemVariants}>
                        <LogPanel logs={scanData.logs} status={scanData.status} />
                    </motion.div>
                </div>
            </div>
        </motion.div>
    );
}
