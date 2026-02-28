import { useEffect, useState, useRef } from 'react';
import './BandwidthCounter.css';

export default function BandwidthCounter({ data }) {
    const [rawMB, setRawMB] = useState(0);
    const [packetKB, setPacketKB] = useState(0);
    const [ratio, setRatio] = useState(0);
    const rafRef = useRef(null);

    useEffect(() => {
        const targets = {
            raw: data?.bandwidth_raw_mb || 2300,
            packet: data?.bandwidth_packet_kb || 6.2,
            ratio: data?.bandwidth_ratio || 380645,
        };
        const startTime = performance.now();
        const duration = 2000;

        const animate = (now) => {
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 4);

            setRawMB(Math.round(targets.raw * eased));
            setPacketKB(parseFloat((targets.packet * eased).toFixed(1)));
            setRatio(Math.round(targets.ratio * eased));

            if (progress < 1) {
                rafRef.current = requestAnimationFrame(animate);
            }
        };

        rafRef.current = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(rafRef.current);
    }, [data]);

    return (
        <div className="bandwidth-counter">
            <div className="bw-segment">
                <span className="bw-value">{rawMB.toLocaleString()}</span>
                <span className="bw-unit">MB raw</span>
            </div>
            <span className="bw-arrow">→</span>
            <div className="bw-segment">
                <span className="bw-value bw-accent">{packetKB}</span>
                <span className="bw-unit">KB packet</span>
            </div>
            <span className="bw-divider">—</span>
            <div className="bw-segment">
                <span className="bw-value bw-highlight">
                    {ratio.toLocaleString()}:1
                </span>
                <span className="bw-unit">reduction</span>
            </div>
        </div>
    );
}
