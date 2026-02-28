import { useState, useEffect, useRef, useCallback } from 'react';
import { submitScan as apiSubmitScan, getScanResult } from '../services/api.js';

export default function useScans() {
    const [scanId, setScanId] = useState(null);
    const [scanData, setScanData] = useState(null);
    const [status, setStatus] = useState('idle');
    const [error, setError] = useState(null);
    const intervalRef = useRef(null);

    const submitScan = useCallback(async (payload) => {
        setStatus('submitting');
        setError(null);
        try {
            const result = await apiSubmitScan(payload);
            const id = result?.scan_id;
            if (id) {
                setScanId(id);
                setStatus('polling');
            }
            return id;
        } catch (err) {
            setError(err.message);
            setStatus('error');
            return null;
        }
    }, []);

    useEffect(() => {
        if (!scanId || status !== 'polling') return;

        const poll = async () => {
            try {
                const data = await getScanResult(scanId);
                if (data) {
                    setScanData(data);
                    if (data.status === 'completed' || data.status === 'failed') {
                        setStatus(data.status);
                        clearInterval(intervalRef.current);
                    }
                }
            } catch (err) {
                // Backend not ready — keep polling
            }
        };

        poll();
        intervalRef.current = setInterval(poll, 2000);

        return () => clearInterval(intervalRef.current);
    }, [scanId, status]);

    return { scanId, scanData, status, error, submitScan };
}
