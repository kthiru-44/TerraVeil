import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import { useEffect } from 'react';
import './MapPanel.css';

function MapUpdater({ center, zoom }) {
    const map = useMap();
    useEffect(() => {
        if (center) map.setView(center, zoom || 11, { animate: true });
    }, [center, zoom, map]);
    return null;
}

export default function MapPanel({ center, zoom = 11, children }) {
    return (
        <MapContainer
            center={center || [16.7, 74.2]}
            zoom={zoom}
            className="leaflet-map"
            zoomControl={true}
            attributionControl={true}
            scrollWheelZoom={true}
        >
            <TileLayer
                url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                attribution='&copy; <a href="https://carto.com/">CARTO</a>'
                subdomains="abcd"
                maxZoom={19}
            />
            <MapUpdater center={center} zoom={zoom} />
            {children}
        </MapContainer>
    );
}
