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

/* ── Date helpers ── */
const MONTHS = [
    { value: '01', label: 'January' },
    { value: '02', label: 'February' },
    { value: '03', label: 'March' },
    { value: '04', label: 'April' },
    { value: '05', label: 'May' },
    { value: '06', label: 'June' },
    { value: '07', label: 'July' },
    { value: '08', label: 'August' },
    { value: '09', label: 'September' },
    { value: '10', label: 'October' },
    { value: '11', label: 'November' },
    { value: '12', label: 'December' },
];

const YEARS = ['2024', '2023', '2022', '2021', '2020', '2019'];

const DAYS = Array.from({ length: 31 }, (_, i) => String(i + 1).padStart(2, '0'));

function parseDate(dateStr) {
    if (!dateStr) return { year: '', month: '', day: '' };
    const parts = dateStr.split('-');
    return { year: parts[0] || '', month: parts[1] || '', day: parts[2] || '' };
}

function buildDate(year, month, day) {
    if (!year || !month || !day) return '';
    return `${year}-${month}-${day}`;
}

export default function Dashboard({ user, scanData, setScanData, selectedRegion, setSelectedRegion, regionPresets }) {
    const [viewMode, setViewMode] = useState('now');
    const [isScanning, setIsScanning] = useState(false);
    const [customLocation, setCustomLocation] = useState('');
    const [customLat, setCustomLat] = useState('');
    const [customLon, setCustomLon] = useState('');
    const [showResults, setShowResults] = useState(true);

    const region = regionPresets[selectedRegion];

    // Date state split into dropdowns
    const defaultStart = parseDate(region.date_start);
    const defaultEnd = parseDate(region.date_end);
    const [startYear, setStartYear] = useState(defaultStart.year || '2021');
    const [startMonth, setStartMonth] = useState(defaultStart.month || '07');
    const [startDay, setStartDay] = useState(defaultStart.day || '15');
    const [endYear, setEndYear] = useState(defaultEnd.year || '2021');
    const [endMonth, setEndMonth] = useState(defaultEnd.month || '07');
    const [endDay, setEndDay] = useState(defaultEnd.day || '25');

    const handleRegionChange = (key) => {
        setSelectedRegion(key);
        if (key !== 'custom') {
            const s = parseDate(regionPresets[key].date_start);
            const e = parseDate(regionPresets[key].date_end);
            setStartYear(s.year); setStartMonth(s.month); setStartDay(s.day);
            setEndYear(e.year); setEndMonth(e.month); setEndDay(e.day);
        }
    };

    const handleScan = async () => {
        setIsScanning(true);
        setShowResults(false);
        try {
            const isCustom = selectedRegion === 'custom';
            const lat = isCustom ? parseFloat(customLat) : region.center[0];
            const lon = isCustom ? parseFloat(customLon) : region.center[1];
            const payload = {
                region: isCustom ? customLocation : selectedRegion,
                bbox: isCustom ? [lon - 0.2, lat - 0.2, lon + 0.2, lat + 0.2] : region.bbox,
                date_start: buildDate(startYear, startMonth, startDay) || region.date_start,
                date_end: buildDate(endYear, endMonth, endDay) || region.date_end,
                source: 'sentinel2',
            };
            await submitScan(payload);
        } catch (e) {
            // Demo mode
        }
        setTimeout(() => {
            setIsScanning(false);
            setShowResults(true);
        }, 3000);
    };

    const mapCenter = selectedRegion === 'custom' && customLat && customLon
        ? [parseFloat(customLat), parseFloat(customLon)]
        : region.center;

    return (
        <motion.div className="dashboard" variants={containerVariants} initial="hidden" animate="visible">

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
                                            <input type="number" className="form-input" placeholder="19.0760" step="0.0001" value={customLat} onChange={(e) => setCustomLat(e.target.value)} />
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">LONGITUDE</label>
                                            <input type="number" className="form-input" placeholder="72.8777" step="0.0001" value={customLon} onChange={(e) => setCustomLon(e.target.value)} />
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {/* Start Date Dropdowns */}
                            <div className="form-group">
                                <label className="form-label">START DATE</label>
                                <div className="date-dropdowns">
                                    <select className="form-select date-select" value={startDay} onChange={(e) => setStartDay(e.target.value)}>
                                        {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
                                    </select>
                                    <select className="form-select date-select date-month" value={startMonth} onChange={(e) => setStartMonth(e.target.value)}>
                                        {MONTHS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                                    </select>
                                    <select className="form-select date-select" value={startYear} onChange={(e) => setStartYear(e.target.value)}>
                                        {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                                    </select>
                                </div>
                            </div>

                            {/* End Date Dropdowns */}
                            <div className="form-group">
                                <label className="form-label">END DATE</label>
                                <div className="date-dropdowns">
                                    <select className="form-select date-select" value={endDay} onChange={(e) => setEndDay(e.target.value)}>
                                        {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
                                    </select>
                                    <select className="form-select date-select date-month" value={endMonth} onChange={(e) => setEndMonth(e.target.value)}>
                                        {MONTHS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                                    </select>
                                    <select className="form-select date-select" value={endYear} onChange={(e) => setEndYear(e.target.value)}>
                                        {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                                    </select>
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
                                        ANALYZING SATELLITE DATA
                                    </span>
                                ) : (
                                    '🛰 LAUNCH SCAN'
                                )}
                            </button>
                        </div>
                    </motion.div>

                    {/* Results — shown after scan */}
                    {showResults && (
                        <>
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
                        </>
                    )}
                </div>
            </div>
        </motion.div>
    );
}
