import { motion } from 'framer-motion';
import './HomePage.css';

const fadeUp = {
    hidden: { opacity: 0, y: 24 },
    visible: (i) => ({
        opacity: 1,
        y: 0,
        transition: { delay: i * 0.08, duration: 0.5, ease: [0.16, 1, 0.3, 1] },
    }),
};

const METRICS = [
    { value: '380,000:1', label: 'DATA COMPRESSION' },
    { value: '~156ms', label: 'ML INFERENCE' },
    { value: '10m', label: 'RESOLUTION' },
    { value: '72h', label: 'FORECAST' },
    { value: '0.97', label: 'CONFIDENCE' },
];

export default function HomePage({ onStartAnalysis }) {
    return (
        <div className="home-page">
            {/* Background */}
            <div className="home-bg-grid" />
            <div className="home-orb home-orb-1" />
            <div className="home-orb home-orb-2" />

            <div className="home-content">

                {/* Hero */}
                <motion.section className="home-hero" custom={0} variants={fadeUp} initial="hidden" animate="visible">
                    <div className="hero-orbital">
                        <svg viewBox="0 0 60 60" className="hero-orbital-svg">
                            <circle cx="30" cy="30" r="28" fill="none" stroke="rgba(192,192,192,0.12)" strokeWidth="0.5" />
                            <circle cx="30" cy="30" r="20" fill="none" stroke="rgba(192,192,192,0.06)" strokeWidth="0.5" strokeDasharray="4 8" />
                            <circle cx="30" cy="30" r="4" fill="#fff" />
                            <circle cx="30" cy="4" r="2.5" fill="#c0c0c0" />
                        </svg>
                    </div>
                    <h1 className="home-hero-title">TERRAVEIL</h1>
                    <p className="home-hero-sub">ORBITAL EDGE INTELLIGENCE</p>
                    <p className="home-hero-desc">
                        Open-source satellite intelligence that transforms raw Sentinel-1 and
                        Sentinel-2 imagery into actionable flood risk assessments — in under 10 minutes, at zero cost.
                    </p>
                    <div className="home-hero-badges">
                        <span className="home-badge">COSMEON · HackX 4.0</span>
                        <span className="home-badge">PS-06</span>
                        <span className="home-badge">Open Source</span>
                    </div>
                    <button className="home-cta" onClick={onStartAnalysis}>
                        <span className="cta-icon"></span> START ANALYSIS
                    </button>
                </motion.section>

                {/* Metrics Strip */}
                <motion.section className="home-metrics" custom={1} variants={fadeUp} initial="hidden" animate="visible">
                    {METRICS.map((m) => (
                        <div key={m.label} className="home-metric">
                            <span className="hm-value">{m.value}</span>
                            <span className="hm-label">{m.label}</span>
                        </div>
                    ))}
                </motion.section>

            </div>
        </div>
    );
}
