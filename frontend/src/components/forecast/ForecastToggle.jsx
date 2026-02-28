import './ForecastToggle.css';

const TABS = [
    { key: 'before', label: 'Before', icon: '📷' },
    { key: 'now', label: 'Now', icon: '🌊' },
    { key: 'forecast', label: '72H Forecast', icon: '📈' },
    { key: 'drought', label: 'Drought Index', icon: '☀️' },
];

export default function ForecastToggle({ viewMode, setViewMode }) {
    return (
        <div className="forecast-toggle">
            {TABS.map((tab) => (
                <button
                    key={tab.key}
                    className={`ft-tab ${viewMode === tab.key ? 'active' : ''}`}
                    onClick={() => setViewMode(tab.key)}
                >
                    <span className="ft-icon">{tab.icon}</span>
                    <span className="ft-label">{tab.label}</span>
                </button>
            ))}
        </div>
    );
}
