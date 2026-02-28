import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import './InfrastructureMarkers.css';

const ICONS = {
    hospital: '🏥',
    school: '🏫',
    bridge: '🌉',
    water: '🚰',
};

const RISK_BORDER = {
    LOW: '#22c55e',
    MEDIUM: '#f59e0b',
    HIGH: '#f97316',
    CRITICAL: '#dc2626',
};

function createIcon(type, riskLevel) {
    const emoji = ICONS[type] || '📍';
    const borderColor = RISK_BORDER[riskLevel] || RISK_BORDER.LOW;
    const isHighRisk = riskLevel === 'HIGH' || riskLevel === 'CRITICAL';

    return L.divIcon({
        className: 'infra-marker-wrapper',
        html: `
      <div class="infra-marker ${isHighRisk ? 'at-risk' : ''}" style="--risk-color:${borderColor}">
        <span class="infra-emoji">${emoji}</span>
        ${isHighRisk ? '<div class="infra-pulse-ring"></div><div class="infra-pulse-ring delay"></div>' : ''}
      </div>
    `,
        iconSize: [36, 36],
        iconAnchor: [18, 18],
        popupAnchor: [0, -20],
    });
}

export default function InfrastructureMarkers({ infrastructure }) {
    if (!infrastructure?.length) return null;

    return (
        <>
            {infrastructure.map((item, i) => (
                <Marker
                    key={i}
                    position={item.coords}
                    icon={createIcon(item.type, item.risk_level)}
                >
                    <Popup>
                        <div className="infra-popup">
                            <div className="infra-popup-header">
                                <span className="infra-popup-icon">{ICONS[item.type]}</span>
                                <strong>{item.name}</strong>
                            </div>
                            <div className="infra-popup-detail">
                                <span>Type: {item.type}</span>
                                <span className={`infra-risk-badge risk-${item.risk_level?.toLowerCase()}`}>
                                    {item.risk_level}
                                </span>
                            </div>
                        </div>
                    </Popup>
                </Marker>
            ))}
        </>
    );
}
