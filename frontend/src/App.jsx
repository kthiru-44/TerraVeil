import { useState, useCallback, useRef } from 'react';
import LoginPage from './components/auth/LoginPage.jsx';
import BootSequence from './components/boot/BootSequence.jsx';
import OrbitalIntro from './components/animation/OrbitalIntro.jsx';
import HomePage from './components/home/HomePage.jsx';
import ScanInput from './components/scan/ScanInput.jsx';
import Dashboard from './components/dashboard/Dashboard.jsx';
import { getRisk } from './services/api.js';
import { normalizeRiskResponse, normalizeCustomScanResponse } from './services/normalize.js';
import './App.css';

/* ── Region Presets ── */
export const REGION_PRESETS = {
    kolhapur: {
        label: 'Kolhapur, Maharashtra',
        bbox: [74.0, 16.5, 74.4, 16.9],
        center: [16.7, 74.2],
        date_start: '2021-07-15',
        date_end: '2021-07-25',
    },
    chennai: {
        label: 'Chennai, Tamil Nadu',
        bbox: [80.0, 12.8, 80.4, 13.2],
        center: [13.0, 80.2],
        date_start: '2023-12-01',
        date_end: '2023-12-15',
    },
    bangalore: {
        label: 'Bangalore, Karnataka',
        bbox: [77.45, 12.85, 77.75, 13.10],
        center: [12.97, 77.59],
        date_start: '2022-09-01',
        date_end: '2022-09-10',
    },
    mumbai: {
        label: 'Mumbai, Maharashtra',
        bbox: [72.75, 18.90, 73.05, 19.20],
        center: [19.07, 72.88],
        date_start: '2023-07-10',
        date_end: '2023-07-20',
    },
    delhi: {
        label: 'Delhi NCR',
        bbox: [76.95, 28.45, 77.35, 28.75],
        center: [28.61, 77.21],
        date_start: '2023-07-08',
        date_end: '2023-07-15',
    },
    kerala: {
        label: 'Kerala (Wayanad)',
        bbox: [75.80, 11.55, 76.20, 11.85],
        center: [11.69, 76.07],
        date_start: '2024-07-25',
        date_end: '2024-08-05',
    },
    pakistan: {
        label: 'Sindh, Pakistan',
        bbox: [67.5, 25.0, 68.5, 26.5],
        center: [25.75, 68.0],
        date_start: '2022-08-20',
        date_end: '2022-09-01',
    },
    custom: {
        label: 'Custom Location',
        bbox: [0, 0, 0, 0],
        center: [20.5, 78.9],
        date_start: '',
        date_end: '',
    },
};

/* ── Demo Data ── */
export const DEMO_SCAN = {
    scan_id: 'demo-scan-001',
    region: 'kolhapur',
    status: 'completed',
    risk_level: 'CRITICAL',
    risk_score: 82,
    confidence: 0.91,
    confidence_low: 0.87,
    confidence_high: 0.95,
    flood_area_km2: 142.7,
    drought_area_km2: 0,
    pop_affected: 234000,
    hospitals_at_risk: 3,
    schools_at_risk: 12,
    roads_km_affected: 47.3,
    bridges_at_risk: 5,
    ndwi_mean: 0.42,
    bandwidth_raw_mb: 2300,
    bandwidth_packet_kb: 6.2,
    bandwidth_ratio: 380645,
    forecast_score: 68,
    forecast_rec: 'High probability of continued flooding over next 72h. Evacuate low-lying areas immediately.',
    rainfall_72h: [45, 62, 38, 55, 70, 48, 58, 42, 65, 50, 72, 40],
    nodes: [
        { node_id: 'SENTINEL-2A', status: 'active', confidence: 0.93, compute_ms: 620, bandwidth_ratio: 380000, flood_area_km2: 145.2 },
        { node_id: 'SENTINEL-2B', status: 'active', confidence: 0.89, compute_ms: 710, bandwidth_ratio: 375000, flood_area_km2: 138.9 },
        { node_id: 'SENTINEL-1A', status: 'active', confidence: 0.91, compute_ms: 580, bandwidth_ratio: 385000, flood_area_km2: 144.1 },
    ],
    infrastructure: [
        { type: 'hospital', name: 'Civil Hospital Kolhapur', coords: [16.705, 74.224], risk_level: 'HIGH' },
        { type: 'hospital', name: 'Shahu Hospital', coords: [16.695, 74.240], risk_level: 'CRITICAL' },
        { type: 'hospital', name: 'Govt. Medical College', coords: [16.715, 74.210], risk_level: 'MEDIUM' },
        { type: 'school', name: 'DY Patil School', coords: [16.680, 74.250], risk_level: 'HIGH' },
        { type: 'school', name: 'Shivaji University', coords: [16.680, 74.238], risk_level: 'HIGH' },
        { type: 'bridge', name: 'Panchganga Bridge', coords: [16.700, 74.230], risk_level: 'CRITICAL' },
        { type: 'bridge', name: 'Rajaram Bridge', coords: [16.690, 74.218], risk_level: 'HIGH' },
        { type: 'water', name: 'Kalamba Water Works', coords: [16.670, 74.245], risk_level: 'HIGH' },
    ],
    logs: [
        { step: 1, step_name: 'SATELLITE_INGESTION', status: 'completed', icon: '🛰', duration_ms: 3200, output: 'Sentinel-2 L2A composite fetched; cloud cover 12%' },
        { step: 2, step_name: 'NDWI_COMPUTATION', status: 'completed', icon: '🌊', duration_ms: 890, output: 'NDWI mean: 0.42; flood mask generated; area: 142.7 km²' },
        { step: 3, step_name: 'SAR_ANALYSIS', status: 'completed', icon: '📡', duration_ms: 1450, output: 'Sentinel-1 VV/VH processed; Otsu threshold: -14.2 dB' },
        { step: 4, step_name: 'CHANGE_DETECTION', status: 'completed', icon: '🔄', duration_ms: 670, output: 'Delta NDWI computed; 89 km² new inundation detected' },
        { step: 5, step_name: 'OEC_INFERENCE', status: 'completed', icon: '🤖', duration_ms: 1820, output: '3/3 orbital nodes processed; avg compute: 637ms' },
        { step: 6, step_name: 'CONSENSUS', status: 'completed', icon: '🔗', duration_ms: 120, output: 'Bayesian consensus: confidence 0.91 [0.87-0.95]' },
        { step: 7, step_name: 'INFRASTRUCTURE_OVERLAY', status: 'completed', icon: '🏗', duration_ms: 540, output: '8 facilities identified; 5 at HIGH+ risk' },
        { step: 8, step_name: 'RISK_CLASSIFICATION', status: 'completed', icon: '⚡', duration_ms: 80, output: 'Risk: CRITICAL (score: 82/100)' },
        { step: 9, step_name: 'FORECAST_72H', status: 'completed', icon: '📈', duration_ms: 950, output: 'Forecast score: 68/100; continued flooding likely' },
        { step: 10, step_name: 'REPORT_GENERATION', status: 'completed', icon: '📋', duration_ms: 210, output: 'Report generated; scan completed successfully' },
    ],
    flood_geojson: {
        type: 'FeatureCollection',
        features: [
            {
                type: 'Feature',
                properties: { intensity: 0.9, type: 'flood' },
                geometry: {
                    type: 'Polygon',
                    coordinates: [[[74.15, 16.65], [74.30, 16.65], [74.30, 16.75], [74.15, 16.75], [74.15, 16.65]]],
                },
            },
            {
                type: 'Feature',
                properties: { intensity: 0.6, type: 'flood' },
                geometry: {
                    type: 'Polygon',
                    coordinates: [[[74.10, 16.70], [74.25, 16.70], [74.25, 16.80], [74.10, 16.80], [74.10, 16.70]]],
                },
            },
            {
                type: 'Feature',
                properties: { intensity: 0.3, type: 'flood' },
                geometry: {
                    type: 'Polygon',
                    coordinates: [[[74.20, 16.60], [74.35, 16.60], [74.35, 16.72], [74.20, 16.72], [74.20, 16.60]]],
                },
            },
        ],
    },
};

export default function App() {
    const [user, setUser] = useState(null);
    const [showBoot, setShowBoot] = useState(false);
    const [activeTab, setActiveTab] = useState('home');
    const [scanData, setScanData] = useState(DEMO_SCAN);

    // Analysis 3-step flow: 'input' → 'scanning' → 'results'
    const [analysisStep, setAnalysisStep] = useState('input');
    const [scanConfig, setScanConfig] = useState(null);

    // Synchronize animation completion + API data arrival
    const pendingApiData = useRef(null);
    const animDone = useRef(false);
    const dataReady = useRef(false);

    // Transition to results only when BOTH animation AND data are ready
    const tryTransition = useCallback(() => {
        if (animDone.current && dataReady.current) {
            if (pendingApiData.current) {
                setScanData(pendingApiData.current);
                console.log('[APP] Using live backend data');
            } else {
                setScanData(DEMO_SCAN);
                console.log('[APP] Using fallback demo data');
            }
            setAnalysisStep('results');
        }
    }, []);

    const handleLogin = useCallback((userData) => {
        setUser(userData);
        setShowBoot(true);
    }, []);

    const handleBootComplete = useCallback(() => {
        setShowBoot(false);
        setActiveTab('home');
    }, []);

    const handleLogout = useCallback(() => {
        setUser(null);
        setShowBoot(false);
        setActiveTab('home');
        setAnalysisStep('input');
    }, []);

    const handleStartAnalysis = useCallback(() => {
        setActiveTab('analysis');
        setAnalysisStep('input');
    }, []);

    const handleLaunchScan = useCallback((config) => {
        setScanConfig(config);
        setAnalysisStep('scanning');
        pendingApiData.current = null;
        animDone.current = false;
        dataReady.current = false;

        // Fire backend API call in parallel with orbital animation
        const regionKey = config.selectedRegion || config.region;
        const dateParam = config.date_end;
        // Convert bbox array [west, south, east, north] to object
        const bboxObj = config.bbox && config.bbox.length === 4
            ? { west: config.bbox[0], south: config.bbox[1], east: config.bbox[2], north: config.bbox[3] }
            : null;

        getRisk(regionKey, dateParam, config.date_start, config.date_end, bboxObj)
            .then((apiData) => {
                const normalized = (regionKey === 'custom')
                    ? normalizeCustomScanResponse(apiData)
                    : normalizeRiskResponse(apiData, regionKey);
                pendingApiData.current = normalized;
                console.log('[API] Live data received from backend:', normalized.scan_id);
            })
            .catch((err) => {
                console.warn('[API] Backend call failed, using demo data:', err.message);
                pendingApiData.current = null;
            })
            .finally(() => {
                dataReady.current = true;
                tryTransition();
            });
    }, [tryTransition]);

    const handleScanAnimationComplete = useCallback(() => {
        animDone.current = true;
        tryTransition();
    }, [tryTransition]);

    const handleNewScan = useCallback(() => {
        setAnalysisStep('input');
        setScanConfig(null);
        pendingApiData.current = null;
        animDone.current = false;
        dataReady.current = false;
    }, []);

    const loggedIn = !!user && !showBoot;

    return (
        <div className="app">
            {/* Login */}
            {!user && <LoginPage onLogin={handleLogin} />}

            {/* Boot Sequence */}
            {user && showBoot && <BootSequence onComplete={handleBootComplete} />}

            {/* Orbital Intro (scan animation) — fullscreen overlay */}
            {loggedIn && analysisStep === 'scanning' && (
                <OrbitalIntro onComplete={handleScanAnimationComplete} scanConfig={scanConfig} />
            )}

            {/* Main App Shell */}
            {loggedIn && analysisStep !== 'scanning' && (
                <>
                    {/* Global Nav */}
                    <nav className="app-nav">
                        <div className="app-nav-left">
                            <div className="app-nav-logo">
                                <svg viewBox="0 0 24 24" className="app-nav-svg">
                                    <circle cx="12" cy="12" r="10" fill="none" stroke="rgba(192,192,192,0.2)" strokeWidth="0.5" />
                                    <circle cx="12" cy="12" r="2" fill="#fff" />
                                    <circle cx="12" cy="2" r="1.2" fill="#c0c0c0" />
                                </svg>
                            </div>
                            <span className="app-nav-brand">TERRAVEIL</span>
                            <span className="app-nav-divider" />
                            <div className="app-nav-tabs">
                                <button
                                    className={`app-tab ${activeTab === 'home' ? 'active' : ''}`}
                                    onClick={() => setActiveTab('home')}
                                >
                                    HOME
                                </button>
                                <button
                                    className={`app-tab ${activeTab === 'analysis' ? 'active' : ''}`}
                                    onClick={handleStartAnalysis}
                                >
                                    ANALYSIS
                                </button>
                            </div>
                        </div>
                        <div className="app-nav-right">
                            <div className="app-nav-status">
                                <span className="status-dot-app" />
                                <span className="status-text-app">ONLINE</span>
                            </div>
                            <div className="app-nav-user" onClick={() => {
                                const el = document.querySelector('.app-profile-dropdown');
                                if (el) el.classList.toggle('visible');
                            }}>
                                <span className="app-user-avatar">{user?.name?.[0]?.toUpperCase() || 'U'}</span>
                                <div className="app-profile-dropdown glass-card-solid">
                                    <div className="apd-header">
                                        <span className="apd-avatar">{user?.name?.[0]?.toUpperCase() || 'U'}</span>
                                        <div className="apd-info">
                                            <span className="apd-name">{user?.name || 'Operator'}</span>
                                            <span className="apd-email">{user?.email || 'user@cosmeon.in'}</span>
                                        </div>
                                    </div>
                                    <div className="apd-divider" />
                                    <button className="apd-logout" onClick={(e) => { e.stopPropagation(); handleLogout(); }}>
                                        ⏻ LOG OUT
                                    </button>
                                </div>
                            </div>
                        </div>
                    </nav>

                    {/* Tab Content */}
                    {activeTab === 'home' && (
                        <HomePage onStartAnalysis={handleStartAnalysis} />
                    )}

                    {activeTab === 'analysis' && analysisStep === 'input' && (
                        <ScanInput
                            regionPresets={REGION_PRESETS}
                            onLaunch={handleLaunchScan}
                        />
                    )}

                    {activeTab === 'analysis' && analysisStep === 'results' && (
                        <Dashboard
                            user={user}
                            scanData={scanData}
                            setScanData={setScanData}
                            scanConfig={scanConfig}
                            regionPresets={REGION_PRESETS}
                            onNewScan={handleNewScan}
                        />
                    )}
                </>
            )}
        </div>
    );
}
