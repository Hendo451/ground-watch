import { useEffect, useRef, useCallback } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

interface WeatherMapProps {
  clientId: string;
  clientSecret: string;
  latitude: number;
  longitude: number;
  safetyRadiusKm?: number;
  groundLabel?: string;
  lastStrikeDistanceKm?: number | null;
  lastStrikeAt?: string | null;
}

// Generate GeoJSON circle polygon from center + radius
function createCircleGeoJSON(lat: number, lng: number, radiusKm: number, points = 64) {
  const coords: [number, number][] = [];
  const earthRadiusKm = 6371;
  for (let i = 0; i <= points; i++) {
    const angle = (i / points) * 2 * Math.PI;
    const dLat = (radiusKm / earthRadiusKm) * (180 / Math.PI);
    const dLng = dLat / Math.cos((lat * Math.PI) / 180);
    coords.push([
      lng + dLng * Math.cos(angle),
      lat + dLat * Math.sin(angle),
    ]);
  }
  return {
    type: 'Feature' as const,
    geometry: { type: 'Polygon' as const, coordinates: [coords] },
    properties: {},
  };
}

const WeatherMap = ({
  clientId,
  clientSecret,
  latitude,
  longitude,
  safetyRadiusKm = 10,
  groundLabel = 'Sports Ground',
  lastStrikeDistanceKm,
  lastStrikeAt,
}: WeatherMapProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const controllerRef = useRef<any>(null);
  const markerRef = useRef<maplibregl.Marker | null>(null);

  const initMap = useCallback(async () => {
    if (!containerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
      center: [longitude, latitude],
      zoom: 9,
      attributionControl: {},
    });

    map.addControl(new maplibregl.NavigationControl(), 'top-right');
    mapRef.current = map;

    map.on('load', async () => {
      // Safety radius circle
      map.addSource('safety-radius', {
        type: 'geojson',
        data: createCircleGeoJSON(latitude, longitude, safetyRadiusKm) as any,
      });
      map.addLayer({
        id: 'safety-radius-fill',
        type: 'fill',
        source: 'safety-radius',
        paint: { 'fill-color': '#ef4444', 'fill-opacity': 0.08 },
      });
      map.addLayer({
        id: 'safety-radius-line',
        type: 'line',
        source: 'safety-radius',
        paint: { 'line-color': '#ef4444', 'line-width': 2, 'line-dasharray': [4, 3], 'line-opacity': 0.6 },
      });

      // Last known strike ring (from database)
      map.addSource('strike-radius', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] } as any,
      });
      map.addLayer({
        id: 'strike-radius-line',
        type: 'line',
        source: 'strike-radius',
        paint: { 'line-color': '#f97316', 'line-width': 2.5, 'line-opacity': 0.8 },
      });

      // Update strike ring with initial data
      if (lastStrikeDistanceKm && lastStrikeDistanceKm > 0) {
        (map.getSource('strike-radius') as maplibregl.GeoJSONSource)?.setData(
          createCircleGeoJSON(latitude, longitude, lastStrikeDistanceKm) as any
        );
      }

      // Ground marker
      const el = document.createElement('div');
      el.className = 'weather-map-marker';
      el.innerHTML = `
        <div style="
          width: 16px; height: 16px;
          background: hsl(45, 93%, 47%);
          border: 2px solid white;
          border-radius: 50%;
          box-shadow: 0 0 8px rgba(234, 179, 8, 0.6);
        "></div>
      `;

      markerRef.current = new maplibregl.Marker({ element: el })
        .setLngLat([longitude, latitude])
        .setPopup(
          new maplibregl.Popup({ offset: 12 }).setHTML(
            `<div style="color:#111;font-weight:600;font-size:13px;padding:2px 4px">${groundLabel}</div>`
          )
        )
        .addTo(map);

      // MapsGL lightning layer
      try {
        const mapsgl = await import('@aerisweather/mapsgl');
        const account = new mapsgl.Account(clientId, clientSecret);
        const controller = new mapsgl.MaplibreMapController(map, { account });
        controllerRef.current = controller;
        controller.on('load', () => {
          controller.addWeatherLayer('lightning-strikes');
        });
      } catch (err) {
        console.error('Failed to initialize MapsGL:', err);
      }
    });
  }, [clientId, clientSecret, latitude, longitude, safetyRadiusKm, groundLabel, lastStrikeDistanceKm]);

  useEffect(() => {
    initMap();
    return () => {
      controllerRef.current?.dispose?.();
      controllerRef.current = null;
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, [initMap]);

  // Re-center when coordinates change
  useEffect(() => {
    if (!mapRef.current) return;
    mapRef.current.flyTo({ center: [longitude, latitude], duration: 1200 });
    markerRef.current?.setLngLat([longitude, latitude]);

    const safeSrc = mapRef.current.getSource('safety-radius') as maplibregl.GeoJSONSource | undefined;
    safeSrc?.setData(createCircleGeoJSON(latitude, longitude, safetyRadiusKm) as any);
  }, [latitude, longitude, safetyRadiusKm]);

  // Update strike ring when strike data changes
  useEffect(() => {
    if (!mapRef.current) return;
    const src = mapRef.current.getSource('strike-radius') as maplibregl.GeoJSONSource | undefined;
    if (!src) return;

    if (lastStrikeDistanceKm && lastStrikeDistanceKm > 0) {
      src.setData(createCircleGeoJSON(latitude, longitude, lastStrikeDistanceKm) as any);
    } else {
      src.setData({ type: 'FeatureCollection', features: [] } as any);
    }
  }, [lastStrikeDistanceKm, latitude, longitude]);

  // Format time ago
  const timeAgo = lastStrikeAt ? (() => {
    const mins = Math.round((Date.now() - new Date(lastStrikeAt).getTime()) / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    return `${Math.round(mins / 60)}h ago`;
  })() : null;

  return (
    <div className="relative w-full h-full" style={{ minHeight: 400 }}>
      <div ref={containerRef} className="w-full h-full rounded-lg overflow-hidden" />
      
      {/* Legend overlay */}
      <div className="absolute bottom-4 left-4 bg-card/90 backdrop-blur-sm border border-border rounded-lg p-3 space-y-2 text-xs z-10">
        <div className="flex items-center gap-2">
          <div className="w-4 h-0.5 border-t-2 border-dashed border-destructive" />
          <span className="text-muted-foreground">Safety zone ({safetyRadiusKm} km)</span>
        </div>
        {lastStrikeDistanceKm && lastStrikeDistanceKm > 0 && (
          <div className="flex items-center gap-2">
            <div className="w-4 h-0.5 bg-orange-500 rounded" />
            <span className="text-muted-foreground">
              Last strike ({lastStrikeDistanceKm.toFixed(1)} km{timeAgo ? `, ${timeAgo}` : ''})
            </span>
          </div>
        )}
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-primary border border-white" />
          <span className="text-muted-foreground">{groundLabel}</span>
        </div>
      </div>
    </div>
  );
};

export default WeatherMap;
