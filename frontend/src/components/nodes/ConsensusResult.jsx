import { motion } from 'framer-motion';
import './ConsensusResult.css';

export default function ConsensusResult({ data }) {
    const nodeCount = data?.nodes?.length || 0;
    const activeNodes = data?.nodes?.filter(n => n.status === 'active').length || 0;

    return (
        <div className="consensus-result glass-card">
            <h3 className="panel-title">
                <span className="section-icon">🔗</span>
                Orbital Consensus
            </h3>

            <div className="consensus-flow">
                {/* Node icons */}
                <div className="consensus-nodes">
                    {(data?.nodes || []).map((node, i) => (
                        <motion.div
                            key={node.node_id}
                            className={`consensus-node ${node.status === 'active' ? 'active' : 'failed'}`}
                            initial={{ opacity: 0, scale: 0 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: i * 0.1, type: 'spring' }}
                        >
                            <span className="c-node-dot" />
                            <span className="c-node-id">{node.node_id.split('-').pop()}</span>
                        </motion.div>
                    ))}
                </div>

                {/* Arrow */}
                <motion.div
                    className="consensus-arrow"
                    initial={{ scaleX: 0, opacity: 0 }}
                    animate={{ scaleX: 1, opacity: 1 }}
                    transition={{ delay: 0.3, duration: 0.5 }}
                >
                    <div className="arrow-line" />
                    <div className="arrow-head">▶</div>
                </motion.div>

                {/* Consensus Badge */}
                <motion.div
                    className="consensus-badge"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.5, type: 'spring' }}
                >
                    <div className="cb-header">CONSENSUS</div>
                    <div className="cb-stats">
                        <span className="cb-stat">
                            <strong>{activeNodes}/{nodeCount}</strong> nodes
                        </span>
                        <span className="cb-divider">·</span>
                        <span className="cb-stat">
                            Confidence <strong className="accent-text">{data.confidence?.toFixed(2)}</strong>
                        </span>
                        <span className="cb-divider">·</span>
                        <span className="cb-stat">
                            Area <strong>{data.flood_area_km2}</strong> km²
                        </span>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
