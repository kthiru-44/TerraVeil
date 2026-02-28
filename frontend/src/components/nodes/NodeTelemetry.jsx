import NodeCard from './NodeCard.jsx';
import './NodeTelemetry.css';

export default function NodeTelemetry({ nodes }) {
    if (!nodes?.length) return null;

    return (
        <div className="node-telemetry glass-card">
            <h3 className="panel-title">
                <span className="section-icon">🤖</span>
                Orbital Node Telemetry
            </h3>
            <div className="node-grid">
                {nodes.map((node) => (
                    <NodeCard key={node.node_id} node={node} />
                ))}
            </div>
        </div>
    );
}
