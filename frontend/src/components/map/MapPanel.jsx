import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import { useEffect } from 'react';
import L from 'leaflet';
import './MapPanel.css';

function MapUpdater({ center, zoom, bounds, geojson }) {
    const map = useMap();
    useEffect(() => {
        if (bounds) {
            // Fit to bounding box [[south,west],[north,east]]
            map.fitBounds(bounds, { padding: [30, 30], animate: true, duration: 0.5, maxZoom: 13 });
        } else if (geojson && geojson.features && geojson.features.length > 0) {
            // Auto-fit to GeoJSON feature extent
            try {
                const layer = L.geoJSON(geojson);
                const geoBounds = layer.getBounds();
                if (geoBounds.isValid()) {
                    map.fitBounds(geoBounds, { padding: [30, 30], animate: true, duration: 0.5, maxZoom: 13 });
                }
            } catch (e) {
                if (center) map.setView(center, zoom || 11, { animate: true });
            }
        } else if (center) {
            map.setView(center, zoom || 11, { animate: true });
        }
    }, [center, zoom, bounds, geojson, map]);
    return null;
}

export default function MapPanel({ center, zoom = 11, bounds, geojson, children }) {
    const initialCenter = center || [16.7, 74.2];
    const initialZoom = bounds ? 10 : (zoom || 11);

    return (
        <MapContainer
            center={initialCenter}
            zoom={initialZoom}
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
            <MapUpdater center={center} zoom={zoom} bounds={bounds} geojson={geojson} />
            {children}
        </MapContainer>
    );
}
