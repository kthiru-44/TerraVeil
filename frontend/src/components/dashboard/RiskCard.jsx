import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import './RiskCard.css';

const RISK_COLORS = {
    LOW: 'var(--risk-low)',
    MEDIUM: 'var(--risk-medium)',
    HIGH: 'var(--risk-high)',
    CRITICAL: 'var(--risk-critical)',
};

export default function RiskCard({ data, viewMode }) {
    const [animatedScore, setAnimatedScore] = useState(0);

    useEffect(() => {
        let raf;
        const target = data.risk_score || 0;
        let current = 0;
        const step = () => {
            current += (target - current) * 0.06;
            if (Math.abs(target - current) < 0.5) {
                setAnimatedScore(target);
            } else {
                setAnimatedScore(Math.round(current));
                raf = requestAnimationFrame(step);
            }
        };
        raf = requestAnimationFrame(step);
        return () => cancelAnimationFrame(raf);
    }, [data.risk_score]);

    const riskColor = RISK_COLORS[data.risk_level] || RISK_COLORS.LOW;
    const gaugePercent = (animatedScore / 100) * 360;

    return (
        <div className="risk-card glass-card">
            <div className="risk-header">
                <h3 className="panel-title">
                    <span className="section-icon"></span>
                    Risk Assessment
                </h3>
                <span
                    className={`badge badge-${data.risk_level?.toLowerCase() === 'critical' ? 'critical' : data.risk_level?.toLowerCase() === 'high' ? 'danger' : data.risk_level?.toLowerCase() === 'medium' ? 'warning' : 'success'}`}
                >
                    {data.risk_level}
                </span>
            </div>

            <div className="risk-body">
                {/* Circular Gauge */}
                <div className="risk-gauge">
                    <div
                        className="gauge-ring"
                        style={{
                            background: `conic-gradient(${riskColor} ${gaugePercent}deg, var(--color-surface) ${gaugePercent}deg)`,
                        }}
                    >
                        <div className="gauge-inner">
                            <span className="gauge-value" style={{ color: riskColor }}>
                                {animatedScore}
                            </span>
                            <span className="gauge-label">RISK</span>
                        </div>
                    </div>
                    <div className="gauge-glow" style={{ '--glow-color': riskColor }} />
                </div>

                {/* Confidence + Details */}
                <div className="risk-details">
                    <div className="risk-detail-row">
                        <span className="detail-label">Confidence</span>
                        <span className="detail-value accent-text">
                            {data.confidence?.toFixed(2)}
                        </span>
                    </div>
                    <div className="risk-detail-row">
                        <span className="detail-label">Band</span>
                        <span className="detail-value confidence-band">
                            [{data.confidence_low?.toFixed(2)} – {data.confidence_high?.toFixed(2)}]
                        </span>
                    </div>
                    <div className="risk-detail-row">
                        <span className="detail-label">NDWI Mean</span>
                        <span className="detail-value">{data.ndwi_mean?.toFixed(2)}</span>
                    </div>
                    <div className="risk-detail-row">
                        <span className="detail-label">Flood Area</span>
                        <span className="detail-value">{data.flood_area_km2} km²</span>
                    </div>

                    {/* Forecast recommendation */}
                    {viewMode === 'forecast' && data.forecast_rec && (
                        <motion.div
                            className="forecast-rec"
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            transition={{ duration: 0.3 }}
                        >
                            <span className="rec-icon"></span>
                            <p className="rec-text">{data.forecast_rec}</p>
                        </motion.div>
                    )}
                </div>
            </div>
        </div>
    );
}
