import { motion } from 'framer-motion';
import './LogRow.css';

const STATUS_CLASS = {
    completed: 'badge-success',
    running: 'badge-info',
    failed: 'badge-danger',
    pending: 'badge-warning',
};

export default function LogRow({ log, index }) {
    return (
        <motion.div
            className="log-row"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05, duration: 0.3 }}
        >
            <span className="log-step-num">{String(log.step).padStart(2, '0')}</span>
            <span className="log-icon">{log.icon}</span>
            <span className="log-step-name">{log.step_name}</span>
            <span className={`badge ${STATUS_CLASS[log.status] || 'badge-info'}`}>
                {log.status}
            </span>
            <span className="log-duration">{log.duration_ms}ms</span>
            <span className="log-output" title={log.output}>
                {log.output}
            </span>
        </motion.div>
    );
}
