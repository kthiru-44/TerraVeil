/* ═══════════════════════════════════════════════════════════════
   ProcessingScreen — Black & Silver Premium Processing Overlay
   Shows real-time pipeline progress via SSE when available,
   with fallback cycling messages for offline/demo mode.
   ═══════════════════════════════════════════════════════════════ */

import { useState, useEffect, useRef, useCallback } from 'react';
import './ProcessingScreen.css';

const STATUS_MESSAGES = [
    'Acquiring spectral bands',
    'Calibrating Sentinel-2 imagery',
    'Fusing SAR backscatter data',
    'Computing NDWI water indices',
    'Running ML flood ensemble',
    'Classifying risk zones',
    'Generating flood polygons',
    'Cross-referencing infrastructure',
    'Building spatial overlays',
    'Compiling risk assessment',
];

const STEP_LABELS = {
    SATELLITE_INGESTION: 'Satellite Ingestion',
    NDWI_COMPUTATION: 'NDWI Computation',
    SAR_ANALYSIS: 'SAR Analysis',
    ML_ENSEMBLE: 'ML Ensemble',
    CHANGE_DETECTION: 'Change Detection',
    OEC_INFERENCE: 'OEC Inference',
    CONSENSUS: 'Bayesian Consensus',
    INFRASTRUCTURE: 'Infrastructure Overlay',
    RISK_CLASSIFICATION: 'Risk Classification',
    FORECAST_72H: '72H Forecast',
    REPORT_GENERATION: 'Report Generation',
    PIPELINE_ERROR: 'Pipeline Error',
};

export default function ProcessingScreen({ onDataReady, scanConfig, scanId }) {
    const [msgIndex, setMsgIndex] = useState(0);
    const [elapsed, setElapsed] = useState(0);
    const [liveSteps, setLiveSteps] = useState([]);
    const [isLive, setIsLive] = useState(false);
    const startTime = useRef(Date.now());
    const eventSourceRef = useRef(null);

    // Elapsed timer
    useEffect(() => {
        const interval = setInterval(() => {
            setElapsed(Math.floor((Date.now() - startTime.current) / 1000));
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    // Cycle status messages (fallback when no SSE)
    useEffect(() => {
        if (isLive) return;
        const interval = setInterval(() => {
            setMsgIndex(prev => (prev + 1) % STATUS_MESSAGES.length);
        }, 3000);
        return () => clearInterval(interval);
    }, [isLive]);

    // Connect to SSE for real-time progress
    useEffect(() => {
        if (!scanId) return;

        const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
        const url = `${baseUrl}/api/v1/scans/${scanId}/progress`;

        try {
            const es = new EventSource(url);
            eventSourceRef.current = es;

            es.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    if (data.keepalive) return;

                    setIsLive(true);
                    setLiveSteps(prev => {
                        const existing = prev.findIndex(s => s.step === data.step && s.step_name === data.step_name);
                        if (existing >= 0) {
                            const updated = [...prev];
                            updated[existing] = data;
                            return updated;
                        }
                        return [...prev, data];
                    });
                } catch (e) {
                    // Ignore parse errors
                }
            };

            es.onerror = () => {
                // SSE failed — fall back to cycling messages
                es.close();
            };

            return () => es.close();
        } catch (e) {
            // EventSource not available
        }
    }, [scanId]);

    const formatTime = useCallback((s) => {
        const m = Math.floor(s / 60);
        const sec = s % 60;
        return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
    }, []);

    const regionLabel = scanConfig?.selectedRegion
        ? scanConfig.selectedRegion.charAt(0).toUpperCase() + scanConfig.selectedRegion.slice(1)
        : 'Region';

    // Determine completion percentage from live steps
    const completedSteps = liveSteps.filter(s => s.status === 'done' || s.status === 'completed').length;
    const progressPct = isLive ? Math.min((completedSteps / 10) * 100, 100) : null;

    // Get current running step
    const currentStep = liveSteps.filter(s => s.status === 'running').pop();
    const currentLabel = currentStep
        ? STEP_LABELS[currentStep.step_name] || currentStep.step_name
        : null;

    return (
        <div className="processing-screen">
            {/* Background */}
            <div className="ps-grid-bg" />
            <div className="ps-vignette" />

            {/* Corner accents */}
            <div className="ps-corner ps-corner--tl" />
            <div className="ps-corner ps-corner--tr" />
            <div className="ps-corner ps-corner--bl" />
            <div className="ps-corner ps-corner--br" />

            {/* Central orbital animation */}
            <div className="ps-orbital">
                <div className="ps-ring-outer" />
                <div className="ps-ring-mid" />
                <div className="ps-ring-inner" />
                <div className="ps-sweep" />
                <div className="ps-core" />
                <div className="ps-dot" />
                <div className="ps-dot" />
                <div className="ps-dot" />
            </div>

            {/* Title */}
            <div className="ps-title">
                <h2>Processing Satellite Data</h2>
                <p className="ps-title-sub">
                    {regionLabel} · {isLive ? 'Live Pipeline' : 'Processing'}
                    {isLive && <span className="ps-live-badge">● LIVE</span>}
                </p>
            </div>

            {/* Status message — live or cycling */}
            <div className="ps-status-area">
                {isLive && currentLabel ? (
                    <div className="ps-status-msg" key={currentLabel}>
                        ◈ {currentLabel}
                        {currentStep?.detail && (
                            <span className="ps-status-detail"> — {currentStep.detail}</span>
                        )}
                    </div>
                ) : (
                    <div className="ps-status-msg" key={msgIndex}>
                        ◈ {STATUS_MESSAGES[msgIndex]}
                    </div>
                )}
            </div>

            {/* Progress bar — real or animated */}
            <div className="ps-progress-track">
                {isLive && progressPct !== null ? (
                    <div
                        className="ps-progress-bar"
                        style={{ width: `${progressPct}%` }}
                    />
                ) : (
                    <div className="ps-progress-glow" />
                )}
            </div>

            {/* Step counter (live mode) */}
            {isLive && (
                <div className="ps-step-counter">
                    Step {completedSteps + (currentStep ? 1 : 0)}/{10}
                </div>
            )}

            {/* Elapsed time */}
            <div className="ps-timer">
                T+ {formatTime(elapsed)}
            </div>

            {/* Bottom telemetry */}
            <div className="ps-telemetry">
                <div className="ps-telem-item">
                    <div className="ps-telem-value">
                        <span className="hl">4</span>/4
                    </div>
                    <div className="ps-telem-label">Orbital Nodes</div>
                </div>
                <div className="ps-telem-item">
                    <div className="ps-telem-value">
                        <span className="hl">90</span>×90
                    </div>
                    <div className="ps-telem-label">Grid Resolution</div>
                </div>
                <div className="ps-telem-item">
                    <div className="ps-telem-value">
                        <span className="hl">S2</span>+<span className="hl">S1</span>
                    </div>
                    <div className="ps-telem-label">Data Sources</div>
                </div>
                <div className="ps-telem-item">
                    <div className="ps-telem-value">
                        <span className="hl">380K</span>:1
                    </div>
                    <div className="ps-telem-label">Compression</div>
                </div>
            </div>
        </div>
    );
}
