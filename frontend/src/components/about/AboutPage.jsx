import { motion } from 'framer-motion';
import './AboutPage.css';

const fadeUp = {
    hidden: { opacity: 0, y: 24 },
    visible: (i) => ({
        opacity: 1,
        y: 0,
        transition: { delay: i * 0.06, duration: 0.5, ease: [0.16, 1, 0.3, 1] },
    }),
};

const TECH_STACK = [
    { icon: '🛰', label: 'Sentinel-2 + S1 SAR', desc: '10m multi-spectral + all-weather radar imagery via Copernicus' },
    { icon: '🧠', label: 'U-Net MobileNetV2', desc: 'Deep learning flood detection with 6.6M parameters, ~156ms inference' },
    { icon: '🌊', label: 'NDWI + SAR Fusion', desc: 'Multi-modal water index + VV-polarized backscatter analysis' },
    { icon: '📡', label: 'Google Earth Engine', desc: 'Petabyte-scale geospatial analysis with global Sentinel coverage' },
    { icon: '🤖', label: 'COSMEON Consensus', desc: '4-node Byzantine fault tolerant orbital edge computing protocol' },
    { icon: '🗺', label: 'Leaflet + GeoJSON', desc: 'Real flood polygons on dark-tile interactive maps with infrastructure' },
    { icon: '⚡', label: 'React 19 + Vite', desc: 'Premium glassmorphic UI with Framer Motion animations' },
    { icon: '🔗', label: 'FastAPI + SQLite', desc: 'Async Python backend with intelligent scan caching' },
    { icon: '🌤', label: 'OpenMeteo Forecast', desc: 'Real-time 72-hour precipitation and temperature forecasting' },
    { icon: '🏥', label: 'OSMnx Infrastructure', desc: 'Real hospital, school, bridge, road risk assessment from OpenStreetMap' },
];

const METRICS = [
    { value: '380,000:1', label: 'DATA COMPRESSION', detail: '2.3 GB raw satellite → 6.2 KB intelligence packet' },
    { value: '~156ms', label: 'ML INFERENCE', detail: 'U-Net MobileNetV2 flood detection per tile' },
    { value: '10m', label: 'SPATIAL RESOLUTION', detail: 'Per-pixel ground truth classification' },
    { value: '72h', label: 'FORECAST WINDOW', detail: 'OpenMeteo precipitation + NDWI trend projection' },
    { value: '0.97', label: 'CONFIDENCE SCORE', detail: 'Multi-node consensus accuracy rating' },
    { value: '4/4', label: 'NODE CONSENSUS', detail: 'Byzantine fault tolerant orbital agreement' },
];

const BENEFITS = [
    {
        icon: '🌍',
        title: 'Open Access for All',
        desc: 'Free for governments, NGOs, disaster response teams, and researchers worldwide. Zero licensing fees, zero vendor lock-in. Designed for the communities that need it most.',
    },
    {
        icon: '💰',
        title: 'Massive Cost Reduction',
        desc: 'Replaces $50,000+/year commercial satellite analysis subscriptions with open-source Sentinel-2 data at zero cost. Self-hostable infrastructure reduces dependency on expensive cloud services.',
    },
    {
        icon: '⏱',
        title: 'Rapid Response',
        desc: 'Reduces flood assessment time from 48–72 hours (manual ground survey) to under 10 minutes with automated satellite analysis. Critical time saved during disaster response windows.',
    },
    {
        icon: '🛡',
        title: 'Lives Protected',
        desc: 'Early warning system enables evacuation of vulnerable populations before critical flood thresholds are breached. Infrastructure mapping identifies hospitals & roads in danger zones.',
    },
    {
        icon: '🌾',
        title: 'Agricultural Safety',
        desc: 'Drought index monitoring protects crop yields by triggering irrigation alerts before soil moisture drops below critical levels. Prevents agricultural losses worth millions.',
    },
    {
        icon: '🏗',
        title: 'Infrastructure Intelligence',
        desc: 'Automatic identification of hospitals, roads, bridges, and utilities in flood zones for priority rescue operations and disaster response resource allocation.',
    },
];

const ACCESS_TIERS = [
    { tier: 'PUBLIC', users: 'Citizens & Communities', access: 'View risk maps, receive flood alerts, access historical data', color: '#4ade80' },
    { tier: 'RESEARCH', users: 'Universities & NGOs', access: 'Full API access, historical data export, custom analysis pipelines', color: '#60a5fa' },
    { tier: 'GOVERNMENT', users: 'NDMA, State Disaster Mgmt Authorities', access: 'Real-time satellite feeds, custom region config, priority processing', color: '#c084fc' },
    { tier: 'OPERATOR', users: 'COSMEON Platform Administrators', access: 'Node management, consensus configuration, full system telemetry', color: '#f59e0b' },
];

const PIPELINE_STEPS = [
    { step: '01', title: 'Satellite Ingestion', desc: 'Fetch Sentinel-2 optical + Sentinel-1 SAR imagery via Google Earth Engine' },
    { step: '02', title: 'NDWI Computation', desc: 'Band math (Green − NIR) / (Green + NIR) at 10m resolution for water detection' },
    { step: '03', title: 'SAR Analysis', desc: 'VV-polarized backscatter thresholding for all-weather flood detection' },
    { step: '04', title: 'ML Ensemble', desc: 'U-Net MobileNetV2 deep learning flood mask fused with physics-based analysis' },
    { step: '05', title: 'Change Detection', desc: 'Temporal differencing between baseline and event imagery to isolate new flooding' },
    { step: '06', title: 'OEC Inference', desc: 'Distributed analysis across 4 simulated LEO orbital edge nodes' },
    { step: '07', title: 'Bayesian Consensus', desc: 'Weighted multi-node agreement with configurable trust weights' },
    { step: '08', title: 'Infrastructure Overlay', desc: 'Cross-reference flood zones with hospitals, roads, bridges from OpenStreetMap' },
    { step: '09', title: 'Risk Classification', desc: 'Composite risk score (0–100) from flood area, NDWI, population, infrastructure' },
    { step: '10', title: 'Forecast & Report', desc: '72H weather forecast, vulnerability projection, Before/Now/Forecast GeoJSON' },
];

export default function AboutPage({ onBack }) {
    return (
        <div className="about-page">
            {/* Background Effects */}
            <div className="about-bg-grid" />
            <div className="about-bg-orb about-orb-1" />
            <div className="about-bg-orb about-orb-2" />
            <div className="about-bg-orb about-orb-3" />




            {/* Content */}
            <div className="about-content">

                {/* Hero */}
                <motion.section className="about-hero" custom={0} variants={fadeUp} initial="hidden" animate="visible">
                    <div className="hero-logo">
                        <svg viewBox="0 0 60 60" className="hero-logo-svg">
                            <circle cx="30" cy="30" r="28" fill="none" stroke="rgba(192,192,192,0.15)" strokeWidth="0.5" />
                            <circle cx="30" cy="30" r="20" fill="none" stroke="rgba(192,192,192,0.08)" strokeWidth="0.5" strokeDasharray="4 8" />
                            <circle cx="30" cy="30" r="12" fill="none" stroke="rgba(192,192,192,0.06)" strokeWidth="0.5" />
                            <circle cx="30" cy="30" r="4" fill="#fff" />
                            <circle cx="30" cy="4" r="2.5" fill="#c0c0c0" />
                        </svg>
                    </div>
                    <h1 className="hero-title">TERRAVEIL</h1>
                    <p className="hero-subtitle">ORBITAL EDGE INTELLIGENCE PLATFORM</p>
                    <p className="hero-desc">
                        Transforming raw satellite imagery into actionable flood intelligence in under 10 minutes.
                        Open-source. Community-driven. Built for those who need it most.
                    </p>
                    <div className="hero-badges">
                        <span className="hero-badge">COSMEON · HackX 4.0</span>
                        <span className="hero-badge">PS-06</span>
                        <span className="hero-badge">Open Source</span>
                    </div>
                </motion.section>

                {/* Mission */}
                <motion.section className="about-section" custom={1} variants={fadeUp} initial="hidden" animate="visible">
                    <div className="section-glass">
                        <p className="mission-text">
                            TerraVeil is an <strong>open-source satellite intelligence platform</strong> that democratizes
                            disaster intelligence previously available only to well-funded government agencies. By leveraging
                            free Sentinel-2 imagery and edge computing consensus, we deliver <strong>real-time flood risk
                                assessments</strong> to communities, NGOs, and governments at <strong>zero cost</strong> — replacing
                            systems that traditionally require $50,000+/year subscriptions.
                        </p>
                    </div>
                </motion.section>

                {/* Pipeline */}
                <motion.section className="about-section" custom={2} variants={fadeUp} initial="hidden" animate="visible">
                    <h2 className="section-heading">Processing Pipeline</h2>
                    <div className="pipeline-grid">
                        {PIPELINE_STEPS.map((s, i) => (
                            <motion.div key={s.step} className="pipeline-card glass-card" custom={2 + i * 0.5} variants={fadeUp} initial="hidden" animate="visible">
                                <span className="pipe-step">{s.step}</span>
                                <div>
                                    <span className="pipe-title">{s.title}</span>
                                    <span className="pipe-desc">{s.desc}</span>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </motion.section>

                {/* Tech Stack */}
                <motion.section className="about-section" custom={3} variants={fadeUp} initial="hidden" animate="visible">
                    <h2 className="section-heading">Technical Architecture</h2>
                    <div className="tech-grid-page">
                        {TECH_STACK.map((t) => (
                            <div key={t.label} className="tech-tile glass-card">
                                <span className="tech-tile-icon">{t.icon}</span>
                                <span className="tech-tile-label">{t.label}</span>
                                <span className="tech-tile-desc">{t.desc}</span>
                            </div>
                        ))}
                    </div>
                </motion.section>

                {/* Metrics */}
                <motion.section className="about-section" custom={4} variants={fadeUp} initial="hidden" animate="visible">
                    <h2 className="section-heading">Performance Metrics</h2>
                    <div className="metrics-grid-page">
                        {METRICS.map((m) => (
                            <div key={m.label} className="metric-tile glass-card">
                                <span className="metric-tile-value">{m.value}</span>
                                <span className="metric-tile-label">{m.label}</span>
                                <span className="metric-tile-detail">{m.detail}</span>
                            </div>
                        ))}
                    </div>
                </motion.section>

                {/* Benefits */}
                <motion.section className="about-section" custom={5} variants={fadeUp} initial="hidden" animate="visible">
                    <h2 className="section-heading">Impact &amp; Benefits</h2>
                    <div className="benefits-grid-page">
                        {BENEFITS.map((b) => (
                            <div key={b.title} className="benefit-tile glass-card">
                                <span className="benefit-tile-icon">{b.icon}</span>
                                <h3 className="benefit-tile-title">{b.title}</h3>
                                <p className="benefit-tile-desc">{b.desc}</p>
                            </div>
                        ))}
                    </div>
                </motion.section>

                {/* Access Tiers */}
                <motion.section className="about-section" custom={6} variants={fadeUp} initial="hidden" animate="visible">
                    <h2 className="section-heading">Access Tiers</h2>
                    <div className="access-grid-page">
                        {ACCESS_TIERS.map((a) => (
                            <div key={a.tier} className="access-tile glass-card">
                                <span className="access-tile-tier" style={{ color: a.color }}>{a.tier}</span>
                                <span className="access-tile-users">{a.users}</span>
                                <span className="access-tile-desc">{a.access}</span>
                            </div>
                        ))}
                    </div>
                </motion.section>

                {/* Cost */}
                <motion.section className="about-section" custom={7} variants={fadeUp} initial="hidden" animate="visible">
                    <h2 className="section-heading">Cost Comparison</h2>
                    <div className="cost-section glass-card">
                        <div className="cost-side cost-old-side">
                            <span className="cost-side-tag">TRADITIONAL APPROACH</span>
                            <span className="cost-side-price">$50,000+<small>/year</small></span>
                            <ul className="cost-side-list">
                                <li>Commercial satellite subscriptions</li>
                                <li>Proprietary GIS software licenses</li>
                                <li>Manual analyst teams (3–5 people)</li>
                                <li>48–72 hours assessment time</li>
                            </ul>
                        </div>
                        <div className="cost-divider">
                            <span className="cost-vs-badge">VS</span>
                        </div>
                        <div className="cost-side cost-new-side">
                            <span className="cost-side-tag cost-tag-free">TERRAVEIL</span>
                            <span className="cost-side-price cost-price-free">$0</span>
                            <ul className="cost-side-list">
                                <li>Free Sentinel - 1 & 2 open data</li>
                                <li>Open-source full stack</li>
                                <li>Automated AI analysis</li>
                                <li>&lt;10 minutes end-to-end</li>
                            </ul>
                        </div>
                    </div>
                </motion.section>

                {/* Footer */}
                <motion.footer className="about-footer-section" custom={8} variants={fadeUp} initial="hidden" animate="visible">
                    <div className="footer-line" />
                    <div className="footer-content">
                        <span className="footer-brand">TERRAVEIL</span>
                        <span className="footer-sep">·</span>
                        <span className="footer-detail">COSMEON · HackX 4.0 · PS-06</span>
                        <span className="footer-sep">·</span>
                        <span className="footer-detail">Built with 🛰 for a safer world</span>
                    </div>
                </motion.footer>

            </div>
        </div>
    );
}
