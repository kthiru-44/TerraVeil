import { GeoJSON } from 'react-leaflet';
import { useMemo } from 'react';

const FLOOD_COLORS = {
    high: 'rgba(0, 212, 255, 0.5)',
    medium: 'rgba(0, 180, 255, 0.35)',
    low: 'rgba(0, 150, 255, 0.2)',
    border: 'rgba(0, 212, 255, 0.6)',
};

const FORECAST_COLORS = {
    high: 'rgba(255, 80, 50, 0.5)',
    medium: 'rgba(255, 120, 50, 0.35)',
    low: 'rgba(255, 160, 50, 0.2)',
    border: 'rgba(255, 100, 50, 0.6)',
};

const DROUGHT_COLORS = {
    high: 'rgba(245, 158, 11, 0.5)',
    medium: 'rgba(245, 158, 11, 0.35)',
    low: 'rgba(245, 158, 11, 0.2)',
    border: 'rgba(245, 158, 11, 0.6)',
};

export default function FloodOverlay({ geojson, viewMode, scanId }) {
    const style = useMemo(() => {
        return (feature) => {
            const intensity = feature?.properties?.intensity || 0.5;
            const isForecast = viewMode === 'forecast';
            const isDrought = viewMode === 'drought';
            const colors = isDrought ? DROUGHT_COLORS : isForecast ? FORECAST_COLORS : FLOOD_COLORS;

            let fillColor = colors.low;
            if (intensity > 0.7) fillColor = colors.high;
            else if (intensity > 0.4) fillColor = colors.medium;

            return {
                fillColor,
                fillOpacity: 0.7,
                color: colors.border,
                weight: 1.5,
                dashArray: isDrought ? '5 5' : isForecast ? '8 4' : null,
            };
        };
    }, [viewMode]);

    if (!geojson || !geojson.features?.length) return null;

    return (
        <GeoJSON
            key={`${scanId || 'default'}-${viewMode}`}
            data={geojson}
            style={style}
            onEachFeature={(feature, layer) => {
                const props = feature.properties;
                const type = props?.type || 'flood';
                const intensity = ((props?.intensity || 0) * 100).toFixed(0);
                const label = type === 'forecast' ? 'FORECAST ZONE' : type === 'drought' ? 'DROUGHT ZONE' : 'FLOOD ZONE';
                const color = type === 'forecast' ? '#ff6432' : type === 'drought' ? '#f59e0b' : '#00d4ff';
                layer.bindPopup(
                    `<div style="font-family:Inter,sans-serif;font-size:13px;">
            <strong style="color:${color};">${label}</strong><br/>
            Intensity: <strong>${intensity}%</strong>
          </div>`
                );
            }}
        />
    );
}

