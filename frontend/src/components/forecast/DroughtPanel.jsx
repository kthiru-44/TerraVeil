import { motion } from 'framer-motion';
import './DroughtPanel.css';

const SEVERITY_TIERS = [
    { label: 'None', range: 'NDDI < 0.1', color: 'var(--color-success)', width: '10%' },
    { label: 'Mild', range: '0.1 – 0.2', color: 'var(--color-warning)', width: '25%' },
    { label: 'Moderate', range: '0.2 – 0.3', color: 'var(--risk-high)', width: '50%' },
    { label: 'Severe', range: '0.3 – 0.4', color: 'var(--color-danger)', width: '75%' },
    { label: 'Extreme', range: '> 0.4', color: 'var(--color-critical)', width: '95%' },
];

export default function DroughtPanel({ data }) {
    const droughtArea = data?.drought_area_km2 || 0;

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
                                animate={{ width: tier.width }}
                                transition={{ delay: i * 0.1, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                            />
                        </div>
                    </div>
                ))}
            </div>

            <div className="drought-stats">
                <div className="drought-stat">
                    <span className="d-stat-value">{droughtArea}</span>
                    <span className="d-stat-label">km² affected</span>
                </div>
                <div className="drought-stat">
                    <span className="d-stat-value">0.18</span>
                    <span className="d-stat-label">Avg NDDI</span>
                </div>
                <div className="drought-stat">
                    <span className="d-stat-value badge badge-warning">MILD</span>
                    <span className="d-stat-label">Severity</span>
                </div>
            </div>
        </motion.div>
    );
}
