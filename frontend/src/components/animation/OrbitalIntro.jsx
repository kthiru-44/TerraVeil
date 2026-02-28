import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './OrbitalIntro.css';

const INDIA_PATH = `M 180 40 L 195 35 L 210 42 L 225 38 L 240 45 L 250 55 L 260 50 
  L 275 58 L 280 72 L 290 80 L 285 95 L 290 110 L 295 125 L 290 140 
  L 285 155 L 280 170 L 270 185 L 260 195 L 250 210 L 240 225 
  L 230 240 L 225 255 L 220 270 L 210 280 L 200 275 L 195 260 
  L 190 250 L 185 265 L 175 275 L 170 260 L 165 245 L 160 235 
  L 155 220 L 150 205 L 145 190 L 140 175 L 135 160 L 130 148 
  L 125 135 L 130 120 L 140 110 L 145 95 L 150 80 L 155 65 
  L 165 52 L 175 45 Z`;

const KOLHAPUR_POS = { x: 170, y: 210 };

const STEPS = [
    { id: 'orbit', at: 0, label: null },
    { id: 'beam', at: 2000, label: null },
    { id: 'anomaly', at: 3500, label: '⚡ Anomaly Detected' },
    { id: 'nodes', at: 5000, label: null },
    { id: 'transmit', at: 6500, label: '📡 Intelligence Transmitted' },
    { id: 'exit', at: 8000, label: null },
];

const NODE_NAMES = ['COSMEON-LEO-07', 'COSMEON-LEO-11', 'COSMEON-LEO-14'];

export default function OrbitalIntro({ onComplete }) {
    const [phase, setPhase] = useState('orbit');
    const [visible, setVisible] = useState(true);

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

    return (
        <AnimatePresence>
            {visible && (
                <motion.div
                    className="orbital-intro"
                    initial={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.6 }}
                >
                    {/* Background grid */}
                    <div className="intro-grid" />
                    <div className="intro-radial" />

                    {/* Skip button */}
                    <button className="skip-btn" onClick={skip}>
                        SKIP ▸
                    </button>

                    {/* Logo */}
                    <motion.div
                        className="intro-logo"
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                    >
                        <span className="logo-icon">🛰</span>
                        <span className="logo-text">TERRAVEIL</span>
                        <span className="logo-sub">ORBITAL EDGE INTELLIGENCE</span>
                    </motion.div>

                    {/* SVG Canvas */}
                    <div className="intro-canvas">
                        <svg viewBox="0 0 420 320" className="intro-svg">
                            {/* India map outline */}
                            <motion.path
                                d={INDIA_PATH}
                                className="india-path"
                                initial={{ pathLength: 0, opacity: 0 }}
                                animate={{ pathLength: 1, opacity: 1 }}
                                transition={{ duration: 2, ease: 'easeInOut' }}
                            />

                            {/* Grid lines */}
                            {[80, 140, 200, 260].map(y => (
                                <motion.line
                                    key={`h-${y}`}
                                    x1="50" y1={y} x2="370" y2={y}
                                    className="grid-line"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 0.15 }}
                                    transition={{ delay: 0.5, duration: 1 }}
                                />
                            ))}
                            {[120, 180, 240, 300].map(x => (
                                <motion.line
                                    key={`v-${x}`}
                                    x1={x} y1="20" x2={x} y2="300"
                                    className="grid-line"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 0.15 }}
                                    transition={{ delay: 0.5, duration: 1 }}
                                />
                            ))}

                            {/* Orbiting satellite */}
                            <motion.g
                                className="satellite-group"
                                style={{ originX: '210px', originY: '160px' }}
                            >
                                <g className="satellite-orbit-anim">
                                    <circle cx="210" cy="40" r="4" className="satellite-dot" />
                                    <circle cx="210" cy="40" r="8" className="satellite-ring" />
                                </g>
                            </motion.g>

                            {/* Kolhapur marker */}
                            <motion.g
                                initial={{ opacity: 0, scale: 0 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 1.5, duration: 0.5, type: 'spring' }}
                            >
                                <circle
                                    cx={KOLHAPUR_POS.x}
                                    cy={KOLHAPUR_POS.y}
                                    r="3"
                                    className="city-dot"
                                />
                                <text
                                    x={KOLHAPUR_POS.x + 8}
                                    y={KOLHAPUR_POS.y + 4}
                                    className="city-label"
                                >
                                    KOLHAPUR
                                </text>
                            </motion.g>

                            {/* Beam sweep */}
                            {(phase === 'beam' || phase === 'anomaly' || phase === 'nodes' || phase === 'transmit') && (
                                <motion.line
                                    x1="210" y1="40"
                                    x2={KOLHAPUR_POS.x}
                                    y2={KOLHAPUR_POS.y}
                                    className="scan-beam"
                                    initial={{ pathLength: 0, opacity: 0 }}
                                    animate={{ pathLength: 1, opacity: 1 }}
                                    transition={{ duration: 0.8, ease: 'easeOut' }}
                                />
                            )}

                            {/* Impact rings at Kolhapur */}
                            {(phase === 'anomaly' || phase === 'nodes' || phase === 'transmit') && (
                                <>
                                    {[0, 0.3, 0.6].map((delay, i) => (
                                        <motion.circle
                                            key={i}
                                            cx={KOLHAPUR_POS.x}
                                            cy={KOLHAPUR_POS.y}
                                            r="5"
                                            className="impact-ring"
                                            initial={{ r: 5, opacity: 0.8 }}
                                            animate={{ r: 40, opacity: 0 }}
                                            transition={{
                                                duration: 1.5,
                                                delay,
                                                repeat: Infinity,
                                                ease: 'easeOut',
                                            }}
                                        />
                                    ))}
                                </>
                            )}
                        </svg>
                    </div>

                    {/* Anomaly text */}
                    <AnimatePresence>
                        {phase === 'anomaly' && (
                            <motion.div
                                className="intro-alert"
                                initial={{ opacity: 0, scale: 0.8, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ type: 'spring', stiffness: 200 }}
                            >
                                <span className="alert-icon">⚡</span>
                                <span>ANOMALY DETECTED</span>
                                <div className="alert-sub">NDWI threshold exceeded · Region: Kolhapur</div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Node cards */}
                    <AnimatePresence>
                        {(phase === 'nodes' || phase === 'transmit') && (
                            <motion.div
                                className="intro-nodes"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                            >
                                {NODE_NAMES.map((name, i) => (
                                    <motion.div
                                        key={name}
                                        className="intro-node-card"
                                        initial={{ opacity: 0, y: 30, scale: 0.8 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        transition={{ delay: i * 0.15, type: 'spring', stiffness: 180 }}
                                    >
                                        <div className="node-status-dot" />
                                        <span className="node-id">{name}</span>
                                        <span className="node-badge">ACTIVE</span>
                                    </motion.div>
                                ))}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Transmitted text */}
                    <AnimatePresence>
                        {phase === 'transmit' && (
                            <motion.div
                                className="intro-transmit"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.5 }}
                            >
                                <span className="transmit-icon">📡</span>
                                <span>INTELLIGENCE TRANSMITTED</span>
                                <div className="transmit-sub">3/3 orbital nodes · Consensus achieved · Confidence 0.97</div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Bottom bar */}
                    <div className="intro-bottom-bar">
                        <div className="bottom-stat">
                            <span className="stat-label">PROTOCOL</span>
                            <span className="stat-value">COSMEON v3.1</span>
                        </div>
                        <div className="bottom-stat">
                            <span className="stat-label">BANDWIDTH</span>
                            <span className="stat-value">380,000:1 REDUCTION</span>
                        </div>
                        <div className="bottom-stat">
                            <span className="stat-label">LATENCY</span>
                            <span className="stat-value">&lt; 800ms</span>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
