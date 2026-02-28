import LogRow from './LogRow.jsx';
import './LogPanel.css';
import { useEffect, useRef } from 'react';

export default function LogPanel({ logs, status }) {
    const scrollRef = useRef(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [logs]);

    return (
        <div className="log-panel glass-card">
            <div className="log-header">
                <h3 className="panel-title">
                    <span className="section-icon">📋</span>
                    Pipeline Execution Log
                </h3>
                <span className={`badge ${status === 'completed' ? 'badge-success' : status === 'failed' ? 'badge-danger' : 'badge-info'}`}>
                    {status?.toUpperCase() || 'IDLE'}
                </span>
            </div>
            <div className="log-body" ref={scrollRef}>
                {logs?.length > 0 ? (
                    logs.map((log, i) => (
                        <LogRow key={i} log={log} index={i} />
                    ))
                ) : (
                    <div className="log-empty">
                        <span className="log-empty-icon">📡</span>
                        <span>Awaiting scan initiation...</span>
                    </div>
                )}
            </div>
        </div>
    );
}
