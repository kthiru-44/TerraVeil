import { useState, useEffect, useRef } from 'react';
import { getLogs } from '../services/api.js';

export default function useLogs(scanId) {
    const [logs, setLogs] = useState([]);
    const [status, setStatus] = useState('idle');
    const intervalRef = useRef(null);

    useEffect(() => {
        if (!scanId) return;

        const poll = async () => {
            try {
                const data = await getLogs(scanId);
                if (Array.isArray(data)) {
                    setLogs(data);
                    const lastLog = data[data.length - 1];
                    if (lastLog?.status === 'completed' || lastLog?.status === 'failed') {
                        setStatus(lastLog.status);
                        clearInterval(intervalRef.current);
                    } else {
                        setStatus('running');
                    }
                }
            } catch (err) {
                // Backend not available yet — silently ignore
            }
        };

        poll();
        intervalRef.current = setInterval(poll, 800);

        return () => clearInterval(intervalRef.current);
    }, [scanId]);

    return { logs, status };
}
