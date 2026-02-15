import { useEffect, useRef, useCallback } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { LightningStrike } from '@/hooks/useData';

interface WeatherMapProps {
  clientId: string;
  clientSecret: string;
  latitude: number;
  longitude: number;
  safetyRadiusKm?: number;
  groundLabel?: string;
  lastStrikeDistanceKm?: number | null;
  lastStrikeAt?: string | null;
  lastStrikeLat?: number | null;
  lastStrikeLng?: number | null;
  strikes?: LightningStrike[];
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
  lastStrikeLat,
  lastStrikeLng,
  strikes = [],
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

      // All strikes source (FeatureCollection)
      map.addSource('strike-point', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] } as any,
      });
      map.addLayer({
        id: 'strike-point-glow',
        type: 'circle',
        source: 'strike-point',
        paint: {
          'circle-radius': 12,
          'circle-color': ['case', ['get', 'recent'], '#f97316', '#f9731666'],
          'circle-opacity': 0.25,
          'circle-blur': 0.8,
        },
      });
      map.addLayer({
        id: 'strike-point-dot',
        type: 'circle',
        source: 'strike-point',
        paint: {
          'circle-radius': 5,
          'circle-color': ['case', ['get', 'recent'], '#f97316', '#f9731688'],
          'circle-stroke-color': '#ffffff',
          'circle-stroke-width': 1.5,
          'circle-opacity': 1,
        },
      });

      // Click handler for strike tooltips
      map.on('click', 'strike-point-dot', (e) => {
        const props = e.features?.[0]?.properties;
        if (!props) return;
        const coords = (e.features![0].geometry as any).coordinates.slice();
        new maplibregl.Popup({ offset: 10 })
          .setLngLat(coords)
          .setHTML(`<div style="color:#111;font-size:12px;padding:2px 4px"><strong>${props.distance_km} km</strong><br/>${props.time_ago}</div>`)
          .addTo(map);
      });
      map.on('mouseenter', 'strike-point-dot', () => { map.getCanvas().style.cursor = 'pointer'; });
      map.on('mouseleave', 'strike-point-dot', () => { map.getCanvas().style.cursor = ''; });

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
  }, [clientId, clientSecret, latitude, longitude, safetyRadiusKm, groundLabel, lastStrikeLat, lastStrikeLng]);

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

  // Update strikes on map when data changes
  useEffect(() => {
    if (!mapRef.current) return;
    const src = mapRef.current.getSource('strike-point') as maplibregl.GeoJSONSource | undefined;
    if (!src) return;

    const now = Date.now();
    const tenMinMs = 10 * 60 * 1000;

    if (strikes.length > 0) {
      const features = strikes.map(s => {
        const ageMs = now - new Date(s.detected_at).getTime();
        const mins = Math.round(ageMs / 60000);
        const timeAgo = mins < 1 ? 'just now' : mins < 60 ? `${mins}m ago` : `${Math.round(mins / 60)}h ago`;
        return {
          type: 'Feature' as const,
          geometry: { type: 'Point' as const, coordinates: [s.longitude, s.latitude] },
          properties: {
            recent: ageMs < tenMinMs,
            distance_km: s.distance_km.toFixed(1),
            time_ago: timeAgo,
          },
        };
      });
      src.setData({ type: 'FeatureCollection', features } as any);
    } else {
      src.setData({ type: 'FeatureCollection', features: [] } as any);
    }
  }, [strikes]);

  // Format time ago
  const timeAgo = lastStrikeAt ? (() => {
    const mins = Math.round((Date.now() - new Date(lastStrikeAt).getTime()) / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    return `${Math.round(mins / 60)}h ago`;
  })() : null;

  return (
    <div className="relative w-full h-full" style={{ minHeight: 400 }}>
      <div ref={containerRef} className="absolute inset-0 rounded-lg overflow-hidden" />
      
      {/* Legend overlay */}
      <div className="absolute bottom-4 left-4 bg-card/90 backdrop-blur-sm border border-border rounded-lg p-3 space-y-2 text-xs z-10">
        <div className="flex items-center gap-2">
          <div className="w-4 h-0.5 border-t-2 border-dashed border-destructive" />
          <span className="text-muted-foreground">Safety zone ({safetyRadiusKm} km)</span>
        </div>
        {strikes.length > 0 && (
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-orange-500 border border-white" />
            <span className="text-muted-foreground">
              {strikes.length} strike{strikes.length !== 1 ? 's' : ''}{lastStrikeDistanceKm ? ` (nearest ${lastStrikeDistanceKm.toFixed(1)} km${timeAgo ? `, ${timeAgo}` : ''})` : ''}
            </span>
          </div>
        )}
        {strikes.length === 0 && lastStrikeDistanceKm && lastStrikeDistanceKm > 0 && (
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-orange-500 border border-white" />
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
