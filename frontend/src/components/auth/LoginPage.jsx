import { useState } from 'react';
import { motion } from 'framer-motion';
import './LoginPage.css';

export default function LoginPage({ onLogin }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = (e) => {
        e.preventDefault();
        setIsLoading(true);
        // Simulate authentication
        setTimeout(() => {
            setIsLoading(false);
            onLogin?.({ email, name: email.split('@')[0] });
        }, 1200);
    };

    return (
        <div className="login-page">
            {/* Background effects */}
            <div className="login-bg-grid" />
            <div className="login-bg-orb orb-1" />
            <div className="login-bg-orb orb-2" />
            <div className="login-bg-line line-1" />
            <div className="login-bg-line line-2" />
            <div className="login-bg-line line-3" />

            <motion.div
                className="login-container"
                initial={{ opacity: 0, y: 30, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            >
                {/* Logo */}
                <div className="login-logo">
                    <div className="login-logo-mark">
                        <svg viewBox="0 0 40 40" className="logo-svg">
                            <circle cx="20" cy="20" r="18" className="logo-orbit" />
                            <circle cx="20" cy="20" r="12" className="logo-orbit inner" />
                            <circle cx="20" cy="20" r="3" className="logo-core" />
                            <circle cx="20" cy="2" r="2" className="logo-satellite" />
                        </svg>
                    </div>
                    <h1 className="login-title">TERRAVEIL</h1>
                    <p className="login-subtitle">Orbital Edge Intelligence Platform</p>
                </div>

                {/* Divider */}
                <div className="login-divider" />

                {/* Form */}
                <form className="login-form" onSubmit={handleSubmit}>
                    <div className="login-field">
                        <label className="login-label">EMAIL</label>
                        <input
                            type="email"
                            className="login-input"
                            placeholder="operator@cosmeon.in"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>

                    <div className="login-field">
                        <label className="login-label">ACCESS KEY</label>
                        <input
                            type="password"
                            className="login-input"
                            placeholder="••••••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        className={`login-btn ${isLoading ? 'loading' : ''}`}
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <span className="login-btn-loading">
                                <span className="login-spinner" />
                                AUTHENTICATING
                            </span>
                        ) : (
                            'ACCESS PLATFORM'
                        )}
                    </button>
                </form>

                {/* Footer info */}
                <div className="login-footer">
                    <div className="login-footer-row">
                        <span className="login-footer-dot" />
                        <span>COSMEON Protocol v3.1</span>
                    </div>
                    <div className="login-footer-row">
                        <span className="login-footer-dot" />
                        <span>Encrypted · Orbital-grade Security</span>
                    </div>
                </div>
            </motion.div>

            {/* Bottom branding */}
            <div className="login-bottom">
                <span>COSMEON · HackX 4.0 · PS-06</span>
            </div>
        </div>
    );
}
