import { motion, AnimatePresence } from 'framer-motion';
import './AboutModal.css';

const backdrop = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
    exit: { opacity: 0 },
};

const modal = {
    hidden: { opacity: 0, scale: 0.95, y: 20 },
    visible: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] } },
    exit: { opacity: 0, scale: 0.97, y: 10, transition: { duration: 0.2 } },
};

const TECH_STACK = [
    { icon: '🛰', label: 'Sentinel-2 MSI', desc: '10m multi-spectral imagery' },
    { icon: '🌊', label: 'NDWI Analysis', desc: 'Normalized Difference Water Index' },
    { icon: '🧠', label: 'Edge AI Consensus', desc: '3-node Byzantine fault tolerance' },
    { icon: '📡', label: 'GEE Pipeline', desc: 'Google Earth Engine backend' },
    { icon: '🗺', label: 'Leaflet + OSM', desc: 'Interactive dark-tile mapping' },
    { icon: '⚡', label: 'React + Vite', desc: 'Sub-second hot module reload' },
];

const METRICS = [
    { value: '380,000:1', label: 'DATA COMPRESSION', detail: '2.3 GB raw → 6.2 KB packet' },
    { value: '<800ms', label: 'END-TO-END LATENCY', detail: 'Satellite to dashboard' },
    { value: '10m', label: 'SPATIAL RESOLUTION', detail: 'Per-pixel ground truth' },
    { value: '72h', label: 'FORECAST WINDOW', detail: 'Predictive flood modeling' },
];

const BENEFITS = [
    {
        icon: '🌍',
        title: 'Open Access',
        desc: 'Free for governments, NGOs, disaster response teams, and researchers worldwide. No licensing fees.',
    },
    {
        icon: '💰',
        title: 'Cost Reduction',
        desc: 'Replaces $50K+/year commercial satellite analysis subscriptions with open-source Sentinel-2 data at zero cost.',
    },
    {
        icon: '⏱',
        title: 'Rapid Response',
        desc: 'Reduces flood assessment time from 48–72 hours (manual survey) to under 10 minutes with automated satellite analysis.',
    },
    {
        icon: '🛡',
        title: 'Lives Protected',
        desc: 'Early warning system enables evacuation of vulnerable populations before critical flood thresholds are reached.',
    },
    {
        icon: '🏗',
        title: 'Infrastructure Mapping',
        desc: 'Automatic identification of hospitals, roads, and bridges in flood zones for priority rescue operations.',
    },
    {
        icon: '🌾',
        title: 'Agricultural Safety',
        desc: 'Drought index monitoring protects crop yields by triggering irrigation alerts before soil moisture drops below critical levels.',
    },
];

const ACCESS_TIERS = [
    { tier: 'PUBLIC', users: 'Citizens & Communities', access: 'View risk maps, receive alerts', color: '#4ade80' },
    { tier: 'RESEARCH', users: 'Universities & NGOs', access: 'Full API access, historical data export', color: '#60a5fa' },
    { tier: 'GOVERNMENT', users: 'NDMA, State Disaster Mgmt', access: 'Real-time feeds, custom regions, priority processing', color: '#c084fc' },
    { tier: 'OPERATOR', users: 'COSMEON Platform Admins', access: 'Node management, consensus config, system telemetry', color: '#f59e0b' },
];

export default function AboutModal({ isOpen, onClose }) {
    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div className="about-backdrop" variants={backdrop} initial="hidden" animate="visible" exit="exit" onClick={onClose}>
                    <motion.div className="about-modal" variants={modal} onClick={(e) => e.stopPropagation()}>

                        {/* Header */}
                        <div className="about-header">
                            <div className="about-logo">
                                <svg viewBox="0 0 40 40" className="about-logo-svg">
                                    <circle cx="20" cy="20" r="18" fill="none" stroke="rgba(192,192,192,0.2)" strokeWidth="0.5" />
                                    <circle cx="20" cy="20" r="12" fill="none" stroke="rgba(192,192,192,0.1)" strokeWidth="0.5" strokeDasharray="3 6" />
                                    <circle cx="20" cy="20" r="3" fill="#fff" filter="url(#glow)" />
                                    <circle cx="20" cy="4" r="2" fill="#c0c0c0" />
                                    <defs>
                                        <filter id="glow"><feGaussianBlur stdDeviation="1.5" result="blur" /><feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
                                    </defs>
                                </svg>
                                <div className="about-logo-text">
                                    <h1 className="about-title">TERRAVEIL</h1>
                                    <p className="about-tagline">Orbital Edge Intelligence Platform</p>
                                </div>
                            </div>
                            <button className="about-close" onClick={onClose}>✕</button>
                        </div>

                        <div className="about-scroll">

                            {/* Mission */}
                            <section className="about-section">
                                <p className="about-mission">
                                    TerraVeil is an <strong>open-source satellite intelligence platform</strong> that transforms raw
                                    Sentinel-2 imagery into actionable flood risk assessments in under 10 minutes. Built for the
                                    COSMEON HackX 4.0 challenge, it democratizes disaster intelligence that was previously available
                                    only to well-funded government agencies.
                                </p>
                            </section>

                            {/* Tech Stack */}
                            <section className="about-section">
                                <h2 className="about-section-title">
                                    <span className="section-icon">⚙</span> Technical Architecture
                                </h2>
                                <div className="tech-grid">
                                    {TECH_STACK.map((t) => (
                                        <div key={t.label} className="tech-card glass-card">
                                            <span className="tech-icon">{t.icon}</span>
                                            <div>
                                                <span className="tech-label">{t.label}</span>
                                                <span className="tech-desc">{t.desc}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>

                            {/* Performance Metrics */}
                            <section className="about-section">
                                <h2 className="about-section-title">
                                    <span className="section-icon">📊</span> Performance Metrics
                                </h2>
                                <div className="metrics-grid">
                                    {METRICS.map((m) => (
                                        <div key={m.label} className="metric-card glass-card">
                                            <span className="metric-big">{m.value}</span>
                                            <span className="metric-label-sm">{m.label}</span>
                                            <span className="metric-detail">{m.detail}</span>
                                        </div>
                                    ))}
                                </div>
                            </section>

                            {/* Benefits */}
                            <section className="about-section">
                                <h2 className="about-section-title">
                                    <span className="section-icon">✨</span> Impact &amp; Benefits
                                </h2>
                                <div className="benefits-grid">
                                    {BENEFITS.map((b) => (
                                        <div key={b.title} className="benefit-card">
                                            <span className="benefit-icon">{b.icon}</span>
                                            <div>
                                                <span className="benefit-title">{b.title}</span>
                                                <span className="benefit-desc">{b.desc}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>

                            {/* Access Tiers */}
                            <section className="about-section">
                                <h2 className="about-section-title">
                                    <span className="section-icon">🔐</span> Access Tiers
                                </h2>
                                <div className="access-list">
                                    {ACCESS_TIERS.map((a) => (
                                        <div key={a.tier} className="access-row glass-card">
                                            <span className="access-tier" style={{ color: a.color }}>{a.tier}</span>
                                            <div className="access-info">
                                                <span className="access-users">{a.users}</span>
                                                <span className="access-desc">{a.access}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>

                            {/* Cost */}
                            <section className="about-section">
                                <h2 className="about-section-title">
                                    <span className="section-icon">💎</span> Cost Comparison
                                </h2>
                                <div className="cost-compare glass-card">
                                    <div className="cost-col cost-old">
                                        <span className="cost-tag">TRADITIONAL</span>
                                        <span className="cost-price">$50,000+<small>/year</small></span>
                                        <span className="cost-detail">Commercial satellite subscriptions, proprietary GIS software, manual analyst teams</span>
                                    </div>
                                    <div className="cost-vs">VS</div>
                                    <div className="cost-col cost-new">
                                        <span className="cost-tag" style={{ color: '#4ade80' }}>TERRAVEIL</span>
                                        <span className="cost-price cost-free">$0</span>
                                        <span className="cost-detail">Open-source stack, free Sentinel-2 data, community-driven, self-hostable</span>
                                    </div>
                                </div>
                            </section>

                            {/* Footer */}
                            <div className="about-footer">
                                <span className="about-footer-text">COSMEON · HackX 4.0 · PS-06</span>
                                <span className="about-footer-divider">·</span>
                                <span className="about-footer-text">Built with 🛰 by the TerraVeil Team</span>
                            </div>
                        </div>

                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
