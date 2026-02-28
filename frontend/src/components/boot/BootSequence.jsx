import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './BootSequence.css';

const BOOT_STAGES = [
    { id: 'auth', label: 'AUTHENTICATING IDENTITY', icon: '⟐', duration: 800 },
    { id: 'handshake', label: 'ESTABLISHING SECURE HANDSHAKE', icon: '⟡', duration: 600 },
    { id: 'nodes', label: 'SYNCING ORBITAL NODES', icon: '◈', duration: 700 },
    { id: 'uplink', label: 'INITIALIZING SATELLITE UPLINK', icon: '◉', duration: 900 },
    { id: 'telemetry', label: 'LOADING TELEMETRY FEEDS', icon: '⬡', duration: 600 },
    { id: 'ready', label: 'PLATFORM READY', icon: '✦', duration: 500 },
];

function HexGrid() {
    const points = [];
    for (let i = 0; i < 60; i++) {
        points.push({
            x: Math.random() * 100,
            y: Math.random() * 100,
            delay: Math.random() * 3,
            size: Math.random() * 2 + 0.5,
        });
    }
    return (
        <div className="boot-hex-grid">
            {points.map((p, i) => (
                <div
                    key={i}
                    className="hex-particle"
                    style={{
                        left: `${p.x}%`,
                        top: `${p.y}%`,
                        animationDelay: `${p.delay}s`,
                        width: `${p.size}px`,
                        height: `${p.size}px`,
                    }}
                />
            ))}
        </div>
    );
}

function ScanLines() {
    return (
        <div className="boot-scanlines">
            {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="scanline" style={{ animationDelay: `${i * 1.2}s` }} />
            ))}
        </div>
    );
}

function CircuitRing({ radius, delay, reverse }) {
    const circumference = 2 * Math.PI * radius;
    return (
        <circle
            cx="200"
            cy="200"
            r={radius}
            fill="none"
            stroke="rgba(255,255,255,0.03)"
            strokeWidth="0.5"
            strokeDasharray={`${circumference * 0.15} ${circumference * 0.05} ${circumference * 0.3} ${circumference * 0.5}`}
            style={{
                animation: `${reverse ? 'ring-spin-r' : 'ring-spin'} ${12 + delay * 2}s linear infinite`,
                animationDelay: `${delay * 0.3}s`,
                transformOrigin: '200px 200px',
            }}
        />
    );
}

export default function BootSequence({ onComplete }) {
    const [currentStage, setCurrentStage] = useState(-1);
    const [progress, setProgress] = useState(0);
    const [showTitle, setShowTitle] = useState(false);
    const [glitchActive, setGlitchActive] = useState(false);
    const [exiting, setExiting] = useState(false);
    const intervalRef = useRef(null);

    useEffect(() => {
        // Start title reveal after a beat
        const t1 = setTimeout(() => setShowTitle(true), 300);

        // Start boot sequence
        const t2 = setTimeout(() => {
            let stage = 0;
            setCurrentStage(0);

            const advanceStage = () => {
                if (stage < BOOT_STAGES.length - 1) {
                    stage++;
                    setCurrentStage(stage);
                    setProgress(Math.round((stage / (BOOT_STAGES.length - 1)) * 100));
                    setTimeout(advanceStage, BOOT_STAGES[stage].duration);
                } else {
                    setProgress(100);
                    // Glitch flash before exit
                    setTimeout(() => {
                        setGlitchActive(true);
                        setTimeout(() => {
                            setGlitchActive(false);
                            setExiting(true);
                            setTimeout(() => onComplete(), 600);
                        }, 300);
                    }, 400);
                }
            };

            setTimeout(advanceStage, BOOT_STAGES[0].duration);
        }, 1000);

        // Random glitch flickers
        intervalRef.current = setInterval(() => {
            setGlitchActive(true);
            setTimeout(() => setGlitchActive(false), 50 + Math.random() * 80);
        }, 2000 + Math.random() * 3000);

        return () => {
            clearTimeout(t1);
            clearTimeout(t2);
            clearInterval(intervalRef.current);
        };
    }, [onComplete]);

    return (
        <AnimatePresence>
            {!exiting && (
                <motion.div
                    className={`boot-sequence ${glitchActive ? 'glitch-active' : ''}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0, scale: 1.02 }}
                    transition={{ duration: 0.4 }}
                >
                    {/* Background layers */}
                    <div className="boot-bg-noise" />
                    <HexGrid />
                    <ScanLines />
                    <div className="boot-vignette" />

                    {/* Central geometric construct */}
                    <div className="boot-center">
                        <svg viewBox="0 0 400 400" className="boot-rings-svg">
                            <CircuitRing radius={180} delay={0} reverse={false} />
                            <CircuitRing radius={150} delay={1} reverse={true} />
                            <CircuitRing radius={120} delay={2} reverse={false} />
                            <CircuitRing radius={90} delay={3} reverse={true} />
                            <CircuitRing radius={60} delay={4} reverse={false} />

                            {/* Core pulse */}
                            <circle cx="200" cy="200" r="8" fill="white" opacity="0.9">
                                <animate attributeName="r" values="6;10;6" dur="2s" repeatCount="indefinite" />
                                <animate attributeName="opacity" values="0.9;0.4;0.9" dur="2s" repeatCount="indefinite" />
                            </circle>

                            {/* Data points on rings */}
                            {[0, 60, 120, 180, 240, 300].map((angle, i) => {
                                const r = 120;
                                const rad = (angle * Math.PI) / 180;
                                const cx = 200 + r * Math.cos(rad);
                                const cy = 200 + r * Math.sin(rad);
                                return (
                                    <circle key={i} cx={cx} cy={cy} r="2" fill="rgba(255,255,255,0.3)">
                                        <animate attributeName="opacity" values="0.1;0.6;0.1" dur={`${1.5 + i * 0.3}s`} repeatCount="indefinite" />
                                    </circle>
                                );
                            })}

                            {/* Connection lines */}
                            {[45, 135, 225, 315].map((angle, i) => {
                                const r1 = 60, r2 = 150;
                                const rad = ((angle + progress * 0.5) * Math.PI) / 180;
                                return (
                                    <line
                                        key={i}
                                        x1={200 + r1 * Math.cos(rad)}
                                        y1={200 + r1 * Math.sin(rad)}
                                        x2={200 + r2 * Math.cos(rad)}
                                        y2={200 + r2 * Math.sin(rad)}
                                        stroke="rgba(255,255,255,0.04)"
                                        strokeWidth="0.5"
                                    />
                                );
                            })}
                        </svg>

                        {/* Title with glitch */}
                        <motion.div
                            className="boot-title-block"
                            initial={{ opacity: 0, y: 20 }}
                            animate={showTitle ? { opacity: 1, y: 0 } : {}}
                            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                        >
                            <h1 className="boot-title" data-text="TERRAVEIL">TERRAVEIL</h1>
                            <p className="boot-subtitle">ORBITAL EDGE INTELLIGENCE PLATFORM</p>
                        </motion.div>
                    </div>

                    {/* Progress section */}
                    <div className="boot-progress-area">
                        {/* Stage log */}
                        <div className="boot-log">
                            {BOOT_STAGES.map((stage, i) => (
                                <motion.div
                                    key={stage.id}
                                    className={`boot-log-line ${i < currentStage ? 'done' : i === currentStage ? 'active' : 'pending'}`}
                                    initial={{ opacity: 0, x: -12 }}
                                    animate={i <= currentStage ? { opacity: 1, x: 0 } : { opacity: 0 }}
                                    transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                                >
                                    <span className="log-icon">{stage.icon}</span>
                                    <span className="log-label">{stage.label}</span>
                                    <span className="log-status">
                                        {i < currentStage ? '✓' : i === currentStage ? '···' : ''}
                                    </span>
                                </motion.div>
                            ))}
                        </div>

                        {/* Progress bar */}
                        <div className="boot-progress-bar">
                            <motion.div
                                className="boot-progress-fill"
                                initial={{ width: '0%' }}
                                animate={{ width: `${progress}%` }}
                                transition={{ duration: 0.4, ease: 'easeOut' }}
                            />
                            <span className="boot-progress-pct">{progress}%</span>
                        </div>

                        {/* Data readout */}
                        <div className="boot-readout">
                            <span className="readout-item">NODE.SYNC: {currentStage >= 2 ? '3/3' : '0/3'}</span>
                            <span className="readout-sep">│</span>
                            <span className="readout-item">UPLINK: {currentStage >= 3 ? 'ACTIVE' : 'STANDBY'}</span>
                            <span className="readout-sep">│</span>
                            <span className="readout-item">LATENCY: {currentStage >= 4 ? '<800ms' : '---'}</span>
                            <span className="readout-sep">│</span>
                            <span className="readout-item">STATUS: {progress === 100 ? 'READY' : 'BOOTING'}</span>
                        </div>
                    </div>

                    {/* Corner decorations */}
                    <div className="boot-corner boot-corner-tl" />
                    <div className="boot-corner boot-corner-tr" />
                    <div className="boot-corner boot-corner-bl" />
                    <div className="boot-corner boot-corner-br" />
                </motion.div>
            )}
        </AnimatePresence>
    );
}
