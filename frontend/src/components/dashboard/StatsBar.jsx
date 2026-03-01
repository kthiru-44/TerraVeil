import { useEffect, useState, useRef } from 'react';
import './StatsBar.css';

function AnimatedNumber({ value, suffix = '', duration = 1500 }) {
    const [display, setDisplay] = useState(0);
    const ref = useRef(null);

    useEffect(() => {
        const target = typeof value === 'number' ? value : parseFloat(value) || 0;
        let start = 0;
        const startTime = performance.now();

        const animate = (now) => {
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            const current = start + (target - start) * eased;

            setDisplay(
                target % 1 !== 0 ? current.toFixed(1) : Math.round(current)
            );

            if (progress < 1) {
                ref.current = requestAnimationFrame(animate);
            }
        };

        ref.current = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(ref.current);
    }, [value, duration]);

    return (
        <span className="stat-number">
            {typeof display === 'number' ? display.toLocaleString() : display}
            {suffix && <span className="stat-suffix">{suffix}</span>}
        </span>
    );
}

const STATS = [
    { key: 'flood_area_km2', label: 'Flood Area', icon: '', suffix: ' km²', color: 'var(--color-accent)' },
    { key: 'pop_affected', label: 'Population', icon: '👥', suffix: '', color: 'var(--color-warning)' },
    { key: 'hospitals_at_risk', label: 'Hospitals', icon: '🏥', suffix: '', color: 'var(--color-danger)' },
    { key: 'roads_km_affected', label: 'Roads', icon: '', suffix: ' km', color: 'var(--risk-high)' },
];

export default function StatsBar({ data }) {
    return (
        <div className="stats-bar">
            {STATS.map((stat) => (
                <div key={stat.key} className="stat-chip glass-card">
                    <div className="stat-chip-icon">{stat.icon}</div>
                    <div className="stat-chip-info">
                        <AnimatedNumber value={data[stat.key]} suffix={stat.suffix} />
                        <span className="stat-chip-label">{stat.label}</span>
                    </div>
                    <div
                        className="stat-chip-bar"
                        style={{ '--bar-color': stat.color }}
                    />
                </div>
            ))}
        </div>
    );
}
