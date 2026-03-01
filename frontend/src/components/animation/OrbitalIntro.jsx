import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './OrbitalIntro.css';

/* ═══════════════════════════════════════════
   Region Map Data — SVG paths & marker positions
   ═══════════════════════════════════════════ */
const REGION_MAPS = {
    kolhapur: {
        label: 'KOLHAPUR',
        sublabel: 'Maharashtra, India',
        path: `M 180 40 L 195 35 L 210 42 L 225 38 L 240 45 L 250 55 L 260 50 
          L 275 58 L 280 72 L 290 80 L 285 95 L 290 110 L 295 125 L 290 140 
          L 285 155 L 280 170 L 270 185 L 260 195 L 250 210 L 240 225 
          L 230 240 L 225 255 L 220 270 L 210 280 L 200 275 L 195 260 
          L 190 250 L 185 265 L 175 275 L 170 260 L 165 245 L 160 235 
          L 155 220 L 150 205 L 145 190 L 140 175 L 135 160 L 130 148 
          L 125 135 L 130 120 L 140 110 L 145 95 L 150 80 L 155 65 
          L 165 52 L 175 45 Z`,
        marker: { x: 170, y: 210 },
        satellite: { cx: 210, cy: 40 },
    },
    chennai: {
        label: 'CHENNAI',
        sublabel: 'Tamil Nadu, India',
        path: `M 160 50 L 180 45 L 200 42 L 220 48 L 240 55 L 258 52
          L 270 65 L 278 80 L 285 100 L 290 120 L 288 140 L 282 158
          L 275 175 L 265 190 L 250 205 L 238 218 L 225 230 L 215 245
          L 205 260 L 195 272 L 185 280 L 175 275 L 168 260 L 162 245
          L 158 228 L 152 210 L 148 195 L 142 178 L 138 160 L 135 142
          L 133 125 L 135 108 L 140 92 L 148 78 L 155 65 Z`,
        marker: { x: 265, y: 170 },
        satellite: { cx: 210, cy: 40 },
    },
    pakistan: {
        label: 'SINDH',
        sublabel: 'Pakistan',
        path: `M 120 40 L 145 35 L 168 32 L 190 38 L 210 42 L 228 48
          L 245 58 L 255 72 L 262 88 L 270 105 L 275 125 L 278 145
          L 276 165 L 270 185 L 260 200 L 248 215 L 235 228 L 220 238
          L 205 248 L 190 255 L 175 260 L 160 258 L 148 250 L 138 238
          L 130 222 L 125 205 L 120 188 L 118 170 L 115 150 L 112 130
          L 110 110 L 112 90 L 115 72 L 118 55 Z`,
        marker: { x: 195, y: 165 },
        satellite: { cx: 195, cy: 40 },
    },
    custom: {
        label: 'TARGET',
        sublabel: 'Custom Region',
        path: `M 130 80 L 160 65 L 195 60 L 230 65 L 260 80 L 280 105
          L 290 135 L 288 168 L 275 198 L 255 222 L 228 240 L 198 248
          L 168 242 L 142 225 L 125 200 L 115 170 L 112 138 L 118 108 Z`,
        marker: { x: 200, y: 155 },
        satellite: { cx: 200, cy: 40 },
    },
};

const STEPS = [
    { id: 'orbit', at: 0 },
    { id: 'beam', at: 2000 },
    { id: 'anomaly', at: 3500 },
    { id: 'nodes', at: 5000 },
    { id: 'transmit', at: 6500 },
    { id: 'exit', at: 8000 },
];

const NODE_NAMES = ['SENTINEL-2A', 'SENTINEL-2B', 'SENTINEL-1A'];

export default function OrbitalIntro({ onComplete, scanConfig }) {
    const [phase, setPhase] = useState('orbit');
    const [visible, setVisible] = useState(true);

    const regionKey = scanConfig?.selectedRegion || 'kolhapur';
    const regionData = REGION_MAPS[regionKey] || REGION_MAPS.custom;
    const regionLabel = scanConfig?.region
        ? scanConfig.region.toString().toUpperCase()
        : regionData.label;
    const markerPos = regionData.marker;
    const satPos = regionData.satellite;

    useEffect(() => {
        const timers = STEPS.map(step =>
            setTimeout(() => {
                if (step.id === 'exit') {
                    setVisible(false);
                    setTimeout(() => onComplete?.(), 600);
                } else {
                    setPhase(step.id);
                }
            }, step.at)
        );
        return () => timers.forEach(clearTimeout);
    }, [onComplete]);

    const skip = () => {
        setVisible(false);
        setTimeout(() => onComplete?.(), 200);
    };

    const beamActive = phase === 'beam' || phase === 'anomaly' || phase === 'nodes' || phase === 'transmit';
    const impactActive = phase === 'anomaly' || phase === 'nodes' || phase === 'transmit';

    return (
        <AnimatePresence>
            {visible && (
                <motion.div
                    className="orbital-intro"
                    initial={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.6 }}
                >
                    <div className="intro-grid" />
                    <div className="intro-radial" />

                    <button className="skip-btn" onClick={skip}>SKIP ▸</button>

                    {/* ── TOP: Logo ── */}
                    <div className="oi-top">
                        <motion.div
                            className="intro-logo"
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8 }}
                        >
                            <span className="logo-icon"></span>
                            <span className="logo-text">TERRAVEIL</span>
                            <span className="logo-sub">ORBITAL EDGE INTELLIGENCE</span>
                        </motion.div>
                    </div>

                    {/* ── MIDDLE: SVG Canvas ── */}
                    <div className="oi-middle">
                        <div className="intro-canvas">
                            <svg viewBox="0 0 420 320" className="intro-svg">
                                <motion.path
                                    d={regionData.path}
                                    className="india-path"
                                    initial={{ pathLength: 0, opacity: 0 }}
                                    animate={{ pathLength: 1, opacity: 1 }}
                                    transition={{ duration: 2, ease: 'easeInOut' }}
                                />

                                {[80, 140, 200, 260].map(y => (
                                    <motion.line key={`h-${y}`} x1="50" y1={y} x2="370" y2={y}
                                        className="grid-line"
                                        initial={{ opacity: 0 }} animate={{ opacity: 0.15 }}
                                        transition={{ delay: 0.5, duration: 1 }}
                                    />
                                ))}
                                {[120, 180, 240, 300].map(x => (
                                    <motion.line key={`v-${x}`} x1={x} y1="20" x2={x} y2="300"
                                        className="grid-line"
                                        initial={{ opacity: 0 }} animate={{ opacity: 0.15 }}
                                        transition={{ delay: 0.5, duration: 1 }}
                                    />
                                ))}

                                <motion.g style={{ originX: `${satPos.cx}px`, originY: '160px' }}>
                                    <g className="satellite-orbit-anim" style={{ transformOrigin: `${satPos.cx}px 160px` }}>
                                        <circle cx={satPos.cx} cy={satPos.cy} r="4" className="satellite-dot" />
                                        <circle cx={satPos.cx} cy={satPos.cy} r="8" className="satellite-ring" />
                                    </g>
                                </motion.g>

                                <motion.g
                                    initial={{ opacity: 0, scale: 0 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: 1.5, duration: 0.5, type: 'spring' }}
                                >
                                    <circle cx={markerPos.x} cy={markerPos.y} r="3" className="city-dot" />
                                    <text x={markerPos.x + 8} y={markerPos.y + 4} className="city-label">
                                        {regionLabel}
                                    </text>
                                </motion.g>

                                {beamActive && (
                                    <motion.line
                                        x1={satPos.cx} y1={satPos.cy}
                                        x2={markerPos.x} y2={markerPos.y}
                                        className="scan-beam"
                                        initial={{ pathLength: 0, opacity: 0 }}
                                        animate={{ pathLength: 1, opacity: 1 }}
                                        transition={{ duration: 0.8, ease: 'easeOut' }}
                                    />
                                )}

                                {impactActive && [0, 0.3, 0.6].map((delay, i) => (
                                    <motion.circle key={i}
                                        cx={markerPos.x} cy={markerPos.y} r="5"
                                        className="impact-ring"
                                        initial={{ r: 5, opacity: 0.8 }}
                                        animate={{ r: 40, opacity: 0 }}
                                        transition={{ duration: 1.5, delay, repeat: Infinity, ease: 'easeOut' }}
                                    />
                                ))}
                            </svg>
                        </div>
                    </div>

                    {/* ── BOTTOM: Info panels (no overlapping!) ── */}
                    <div className="oi-bottom">
                        {/* Anomaly alert */}
                        <AnimatePresence mode="wait">
                            {phase === 'anomaly' && (
                                <motion.div className="intro-alert" key="alert"
                                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -5 }} transition={{ duration: 0.3 }}
                                >
                                    <span className="alert-icon"></span>
                                    <span className="alert-text">ANOMALY DETECTED</span>
                                    <span className="alert-sub">NDWI threshold exceeded · Region: {regionLabel}</span>
                                </motion.div>
                            )}

                            {(phase === 'nodes' || phase === 'transmit') && (
                                <motion.div className="oi-bottom-group" key="nodes-group"
                                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0 }} transition={{ duration: 0.3 }}
                                >
                                    <div className="intro-nodes">
                                        {NODE_NAMES.map((name, i) => (
                                            <motion.div key={name} className="intro-node-card"
                                                initial={{ opacity: 0, y: 15, scale: 0.9 }}
                                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                                transition={{ delay: i * 0.1, type: 'spring', stiffness: 200 }}
                                            >
                                                <div className="node-status-dot" />
                                                <span className="node-id">{name}</span>
                                                <span className="node-badge">ACTIVE</span>
                                            </motion.div>
                                        ))}
                                    </div>
                                    {phase === 'transmit' && (
                                        <motion.div className="intro-transmit"
                                            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                            transition={{ duration: 0.4 }}
                                        >
                                            <span>INTELLIGENCE TRANSMITTED</span>
                                            <span className="transmit-sub">3/3 nodes · Consensus achieved · {regionLabel}</span>
                                        </motion.div>
                                    )}
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Bottom stats */}
                        <div className="intro-bottom-bar">
                            <div className="bottom-stat">
                                <span className="stat-label">TARGET</span>
                                <span className="stat-value">{regionLabel}</span>
                            </div>
                            <div className="bottom-stat">
                                <span className="stat-label">PROTOCOL</span>
                                <span className="stat-value">Copernicus ESA</span>
                            </div>
                            <div className="bottom-stat">
                                <span className="stat-label">BANDWIDTH</span>
                                <span className="stat-value">380,000:1</span>
                            </div>
                            <div className="bottom-stat">
                                <span className="stat-label">LATENCY</span>
                                <span className="stat-value">&lt; 800ms</span>
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
