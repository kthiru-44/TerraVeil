import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import './LoadingScreen.css';

const SIMULATED_LOGS = [
    "[SYSTEM] Initiating TerraVeil core sequence...",
    "[NETWORK] Handshake with Copernicus Open Access Hub...",
    "[AUTH] Validating service account credentials...",
    "[GEE] Petabyte-scale computation cluster allocated.",
    "[INGEST] Fetching Sentinel-2 L2A optical composite...",
    "[INGEST] Fetching Sentinel-1 GRD SAR backscatter...",
    "[COMPUTE] Executing NDWI band math (Green - NIR) / (Green + NIR)...",
    "[SAR] Applying VV backscatter Otsu thresholding...",
    "[AI] Spawning U-Net MobileNetV2 inference nodes...",
    "[EDGE] Node SENTINEL-2A active. Computing...",
    "[EDGE] Node SENTINEL-2B active. Computing...",
    "[EDGE] Node SENTINEL-1A active. Computing...",
    "[CONSENSUS] Aggregating Byzantine fault tolerant graph...",
    "[CONSENSUS] 3/3 nodes reached agreement. Confidence high.",
    "[VECTOR] Converting raster mask to GeoJSON polygons...",
    "[INFRA] Querying OpenStreetMap for hospitals, schools, roads...",
    "[FORECAST] Analyzing 72H OpenMeteo rainfall projections...",
    "[CLASSIFY] Generating composite risk score...",
    "[DATA] Assembling intelligence packet (6.2 KB)...",
    "[SYSTEM] Finalizing report payload..."
];

export default function LoadingScreen({ regionLabel }) {
    const [logs, setLogs] = useState([]);

    useEffect(() => {
        let currentIndex = 0;
        const interval = setInterval(() => {
            if (currentIndex < SIMULATED_LOGS.length) {
                setLogs(prev => [...prev, SIMULATED_LOGS[currentIndex]]);
                currentIndex++;
            } else {
                clearInterval(interval);
            }
        }, 400); // Add a new log every ~400ms

        return () => clearInterval(interval);
    }, []);

    return (
        <motion.div
            className="loading-screen"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
        >
            <div className="ls-overlay" />

            <div className="ls-content">
                <div className="ls-spinner">
                    <div className="ls-spinner-orbit" />
                    <div className="ls-spinner-core" />
                </div>

                <h2 className="ls-title">SCANNING REGION</h2>
                <h3 className="ls-subtitle">{regionLabel || 'TARGET ACQUIRED'}</h3>

                <div className="ls-terminal">
                    <div className="ls-terminal-header">
                        <span className="ls-dot" style={{ background: '#333' }} />
                        <span className="ls-dot" style={{ background: '#333' }} />
                        <span className="ls-dot" style={{ background: '#333' }} />
                        <span className="ls-term-title">TERRAVEIL_EDGE_TERMINAL</span>
                    </div>
                    <div className="ls-terminal-body">
                        {logs.map((log, i) => (
                            <motion.div
                                key={i}
                                className="ls-log-line"
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                            >
                                <span className="ls-log-time">{new Date().toISOString().substring(11, 23)}</span>
                                <span className="ls-log-text">{log}</span>
                            </motion.div>
                        ))}
                        <div className="ls-cursor" />
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
