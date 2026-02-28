import { motion } from 'framer-motion';
import './NodeCard.css';

export default function NodeCard({ node }) {
    const isActive = node.status === 'active';

    return (
        <motion.div
            className={`node-card glass-card ${isActive ? 'active' : 'failed'}`}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{ scale: 1.02, y: -2 }}
            transition={{ duration: 0.3 }}
        >
            <div className="node-card-header">
                <div className="node-card-status">
                    <span className={`node-dot ${isActive ? 'dot-active' : 'dot-failed'}`} />
                    <span className="node-card-id">{node.node_id}</span>
                </div>
                <span className={`badge ${isActive ? 'badge-success' : 'badge-danger'}`}>
                    {isActive ? 'ACTIVE' : 'FAILED'}
                </span>
            </div>

            <div className="node-card-metrics">
                <div className="node-metric">
                    <span className="metric-label">Confidence</span>
                    <span className="metric-value">{node.confidence?.toFixed(2)}</span>
                    <div className="metric-bar">
                        <div className="metric-bar-fill" style={{ width: `${(node.confidence || 0) * 100}%` }} />
                    </div>
                </div>
                <div className="node-metric">
                    <span className="metric-label">Compute</span>
                    <span className="metric-value">{node.compute_ms}ms</span>
                    <div className="metric-bar">
                        <div
                            className="metric-bar-fill compute"
                            style={{ width: `${Math.min((node.compute_ms || 0) / 800 * 100, 100)}%` }}
                        />
                    </div>
                </div>
                <div className="node-metric-row">
                    <div className="node-metric-inline">
                        <span className="metric-label">Flood</span>
                        <span className="metric-value-sm">{node.flood_area_km2} km²</span>
                    </div>
                    <div className="node-metric-inline">
                        <span className="metric-label">BW Ratio</span>
                        <span className="metric-value-sm">{(node.bandwidth_ratio / 1000).toFixed(0)}K:1</span>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
