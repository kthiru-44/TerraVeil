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

const FEATURES = [
    { icon: '', title: 'Satellite Ingestion', desc: 'Real-time Sentinel-2 MSI imagery at 10m resolution via Copernicus Open Access Hub' },
    { icon: '', title: 'Flood Detection', desc: 'NDWI-based water body classification with automated threshold analysis' },
    { icon: '', title: 'Edge AI Consensus', desc: '3-node Byzantine fault tolerant processing for verified risk assessments' },
    { icon: '', title: 'GEE Pipeline', desc: 'Google Earth Engine backend for petabyte-scale geospatial computation' },
    { icon: '', title: 'Infrastructure Mapping', desc: 'Automatic identification of hospitals, roads, and bridges in flood zones' }
];

const METRICS = [
    { value: '380,000:1', label: 'DATA COMPRESSION' },
    { value: '<800ms', label: 'LATENCY' },
    { value: '10m', label: 'RESOLUTION' },
    { value: '72h', label: 'FORECAST' },
];

const PIPELINE = [
    { step: '01', title: 'Ingest', desc: 'Sentinel-2 L2A tiles via GEE' },
    { step: '02', title: 'Compute', desc: 'NDWI band math at 10m' },
    { step: '03', title: 'Classify', desc: 'Flood mask thresholding' },
    { step: '04', title: 'Vectorize', desc: 'Raster → GeoJSON polygons' },
    { step: '05', title: 'Consensus', desc: '3-node BFT agreement' },
    { step: '06', title: 'Deliver', desc: '6.2 KB packet in <800ms' },
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
                        Open-source satellite intelligence that transforms raw Sentinel-2 imagery into
                        actionable flood risk assessments — in under 10 minutes, at zero cost.
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
            </div>
        </div>
    );
}
