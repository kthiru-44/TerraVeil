import { motion } from 'framer-motion';
import './DroughtPanel.css';

const SEVERITY_TIERS = [
    { label: 'None', range: 'NDDI < 0.1', color: 'var(--color-success)', threshold: 0.1 },
    { label: 'Mild', range: '0.1 – 0.2', color: 'var(--color-warning)', threshold: 0.2 },
    { label: 'Moderate', range: '0.2 – 0.3', color: 'var(--risk-high)', threshold: 0.3 },
    { label: 'Severe', range: '0.3 – 0.4', color: 'var(--color-danger)', threshold: 0.4 },
    { label: 'Extreme', range: '> 0.4', color: 'var(--color-critical)', threshold: 1.0 },
];

function getBarWidth(nddiMean, threshold, i) {
    // Fill bars based on actual NDDI mean value
    if (nddiMean >= threshold) return '95%';
    if (i === 0 && nddiMean >= 0) return `${Math.min(95, (nddiMean / 0.1) * 95)}%`;
    const prevThreshold = SEVERITY_TIERS[i - 1]?.threshold || 0;
    if (nddiMean > prevThreshold) {
        const range = threshold - prevThreshold;
        const progress = (nddiMean - prevThreshold) / range;
        return `${Math.min(95, progress * 95)}%`;
    }
    return '0%';
}

export default function DroughtPanel({ data }) {
    const droughtArea = data?.drought_area_km2 || 0;
    const nddiMean = data?.drought_nddi_mean || 0;
    const severity = data?.drought_severity || 'NORMAL';

    // Map severity to badge class
    const severityBadge = severity === 'EMERGENCY' || severity === 'EXTREME'
        ? 'badge-danger' : severity === 'WARNING' || severity === 'SEVERE'
            ? 'badge-warning' : severity === 'WATCH' || severity === 'MODERATE'
                ? 'badge-info' : 'badge-success';

    return (
        <motion.div
            className="drought-panel glass-card"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
        >
            <h3 className="panel-title">
                <span className="section-icon">☀️</span>
                Drought Severity Index (NDDI)
            </h3>

            <div className="drought-tiers">
                {SEVERITY_TIERS.map((tier, i) => (
                    <div key={tier.label} className="drought-tier">
                        <div className="tier-info">
                            <span className="tier-label">{tier.label}</span>
                            <span className="tier-range">{tier.range}</span>
                        </div>
                        <div className="tier-bar-track">
                            <motion.div
                                className="tier-bar-fill"
                                style={{ backgroundColor: tier.color }}
                                initial={{ width: 0 }}
                                animate={{ width: getBarWidth(nddiMean, tier.threshold, i) }}
                                transition={{ delay: i * 0.1, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                            />
                        </div>
                    </div>
                ))}
            </div>

            <div className="drought-stats">
                <div className="drought-stat">
                    <span className="d-stat-value">{droughtArea.toFixed(1)}</span>
                    <span className="d-stat-label">km² affected</span>
                </div>
                <div className="drought-stat">
                    <span className="d-stat-value">{nddiMean.toFixed(2)}</span>
                    <span className="d-stat-label">Avg NDDI</span>
                </div>
                <div className="drought-stat">
                    <span className={`d-stat-value badge ${severityBadge}`}>{severity}</span>
                    <span className="d-stat-label">Severity</span>
                </div>
            </div>
        </motion.div>
    );
}
