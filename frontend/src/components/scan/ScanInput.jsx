import { useState } from 'react';
import { motion } from 'framer-motion';
import './ScanInput.css';

const MONTHS = [
    { value: '01', label: 'January' }, { value: '02', label: 'February' },
    { value: '03', label: 'March' }, { value: '04', label: 'April' },
    { value: '05', label: 'May' }, { value: '06', label: 'June' },
    { value: '07', label: 'July' }, { value: '08', label: 'August' },
    { value: '09', label: 'September' }, { value: '10', label: 'October' },
    { value: '11', label: 'November' }, { value: '12', label: 'December' },
];
const YEARS = ['2024', '2023', '2022', '2021', '2020', '2019'];
const DAYS = Array.from({ length: 31 }, (_, i) => String(i + 1).padStart(2, '0'));

function parseDate(dateStr) {
    if (!dateStr) return { year: '', month: '', day: '' };
    const [y, m, d] = dateStr.split('-');
    return { year: y || '', month: m || '', day: d || '' };
}

const fadeUp = {
    hidden: { opacity: 0, y: 20 },
    visible: (i) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.5, ease: [0.16, 1, 0.3, 1] } }),
};

export default function ScanInput({ regionPresets, onLaunch }) {
    const [selectedRegion, setSelectedRegion] = useState('kolhapur');
    const [customLocation, setCustomLocation] = useState('');
    const [customLat, setCustomLat] = useState('');
    const [customLon, setCustomLon] = useState('');

    const region = regionPresets[selectedRegion];
    const defStart = parseDate(region?.date_start);
    const defEnd = parseDate(region?.date_end);

    const [sDay, setSDay] = useState(defStart.day || '15');
    const [sMonth, setSMonth] = useState(defStart.month || '07');
    const [sYear, setSYear] = useState(defStart.year || '2021');
    const [eDay, setEDay] = useState(defEnd.day || '25');
    const [eMonth, setEMonth] = useState(defEnd.month || '07');
    const [eYear, setEYear] = useState(defEnd.year || '2021');

    const handleRegionChange = (key) => {
        setSelectedRegion(key);
        if (key !== 'custom') {
            const s = parseDate(regionPresets[key].date_start);
            const e = parseDate(regionPresets[key].date_end);
            setSDay(s.day); setSMonth(s.month); setSYear(s.year);
            setEDay(e.day); setEMonth(e.month); setEYear(e.year);
        }
    };

    const handleLaunch = () => {
        const isCustom = selectedRegion === 'custom';
        const lat = isCustom ? parseFloat(customLat) : region.center[0];
        const lon = isCustom ? parseFloat(customLon) : region.center[1];
        onLaunch({
            region: isCustom ? customLocation : selectedRegion,
            selectedRegion,
            bbox: isCustom ? [lon - 0.2, lat - 0.2, lon + 0.2, lat + 0.2] : region.bbox,
            center: [lat, lon],
            date_start: `${sYear}-${sMonth}-${sDay}`,
            date_end: `${eYear}-${eMonth}-${eDay}`,
        });
    };

    return (
        <div className="scan-input-page">
            <div className="si-bg-grid" />
            <div className="si-orb si-orb-1" />
            <div className="si-orb si-orb-2" />

            <div className="si-content">
                <motion.div className="si-header" custom={0} variants={fadeUp} initial="hidden" animate="visible">
                    <div className="si-icon">
                        <svg viewBox="0 0 48 48" className="si-icon-svg">
                            <circle cx="24" cy="24" r="22" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="0.5" />
                            <circle cx="24" cy="24" r="14" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="0.5" strokeDasharray="3 6" />
                            <circle cx="24" cy="24" r="3" fill="white" />
                        </svg>
                    </div>
                    <h1 className="si-title">Configure Scan</h1>
                    <p className="si-subtitle">Select a region and date range for satellite analysis</p>
                </motion.div>

                <motion.div className="si-card glass-card" custom={1} variants={fadeUp} initial="hidden" animate="visible">

                    {/* Region Selection */}
                    <div className="si-section">
                        <label className="si-label">
                            <span className="si-label-icon"></span> TARGET REGION
                        </label>
                        <div className="si-region-grid">
                            {Object.entries(regionPresets).map(([key, val]) => (
                                <button
                                    key={key}
                                    className={`si-region-btn ${selectedRegion === key ? 'active' : ''}`}
                                    onClick={() => handleRegionChange(key)}
                                >
                                    <span className="si-region-name">{val.label}</span>
                                    {key !== 'custom' && (
                                        <span className="si-region-coords">
                                            {val.center[0].toFixed(1)}°N, {val.center[1].toFixed(1)}°E
                                        </span>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Custom Location */}
                    {selectedRegion === 'custom' && (
                        <motion.div className="si-section si-custom" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
                            <div className="si-field">
                                <label className="si-label-sm">LOCATION NAME</label>
                                <input type="text" className="si-input" placeholder="e.g. Mumbai, India" value={customLocation} onChange={(e) => setCustomLocation(e.target.value)} />
                            </div>
                            <div className="si-row-2">
                                <div className="si-field">
                                    <label className="si-label-sm">LATITUDE</label>
                                    <input type="number" className="si-input" placeholder="19.0760" step="0.0001" value={customLat} onChange={(e) => setCustomLat(e.target.value)} />
                                </div>
                                <div className="si-field">
                                    <label className="si-label-sm">LONGITUDE</label>
                                    <input type="number" className="si-input" placeholder="72.8777" step="0.0001" value={customLon} onChange={(e) => setCustomLon(e.target.value)} />
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* Date Range */}
                    <div className="si-section">
                        <label className="si-label">
                            <span className="si-label-icon"></span> ANALYSIS DATE RANGE
                        </label>
                        <div className="si-dates">
                            <div className="si-date-group">
                                <span className="si-date-tag">FROM</span>
                                <div className="si-date-row">
                                    <select className="si-select si-day" value={sDay} onChange={(e) => setSDay(e.target.value)}>
                                        {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
                                    </select>
                                    <select className="si-select si-month" value={sMonth} onChange={(e) => setSMonth(e.target.value)}>
                                        {MONTHS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                                    </select>
                                    <select className="si-select si-year" value={sYear} onChange={(e) => setSYear(e.target.value)}>
                                        {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                                    </select>
                                </div>
                            </div>
                            <span className="si-date-arrow">→</span>
                            <div className="si-date-group">
                                <span className="si-date-tag">TO</span>
                                <div className="si-date-row">
                                    <select className="si-select si-day" value={eDay} onChange={(e) => setEDay(e.target.value)}>
                                        {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
                                    </select>
                                    <select className="si-select si-month" value={eMonth} onChange={(e) => setEMonth(e.target.value)}>
                                        {MONTHS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                                    </select>
                                    <select className="si-select si-year" value={eYear} onChange={(e) => setEYear(e.target.value)}>
                                        {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Launch */}
                    <button className="si-launch" onClick={handleLaunch}>
                        <span className="si-launch-icon"></span>
                        LAUNCH SATELLITE SCAN
                    </button>
                </motion.div>

                <motion.p className="si-hint" custom={2} variants={fadeUp} initial="hidden" animate="visible">
                    Sentinel-2 MSI imagery · 10m resolution · NDWI flood detection
                </motion.p>
            </div>
        </div>
    );
}
