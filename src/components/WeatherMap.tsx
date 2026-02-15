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
}: WeatherMapProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const controllerRef = useRef<any>(null);
  const markerRef = useRef<maplibregl.Marker | null>(null);

  const initMap = useCallback(async () => {
    if (!containerRef.current || mapRef.current) return;

    // Create MapLibre map (free, no token)
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
      // Add safety radius circle
      map.addSource('safety-radius', {
        type: 'geojson',
        data: createCircleGeoJSON(latitude, longitude, safetyRadiusKm) as any,
      });

      map.addLayer({
        id: 'safety-radius-fill',
        type: 'fill',
        source: 'safety-radius',
        paint: {
          'fill-color': '#ef4444',
          'fill-opacity': 0.08,
        },
      });

      map.addLayer({
        id: 'safety-radius-line',
        type: 'line',
        source: 'safety-radius',
        paint: {
          'line-color': '#ef4444',
          'line-width': 2,
          'line-dasharray': [4, 3],
          'line-opacity': 0.6,
        },
      });

      // Add ground marker
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

      // Load MapsGL SDK and add lightning layer
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
  }, [clientId, clientSecret, latitude, longitude, safetyRadiusKm, groundLabel]);

  // Initialize map
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

    const src = mapRef.current.getSource('safety-radius') as maplibregl.GeoJSONSource | undefined;
    if (src) {
      src.setData(createCircleGeoJSON(latitude, longitude, safetyRadiusKm) as any);
    }
  }, [latitude, longitude, safetyRadiusKm]);

  return (
    <div
      ref={containerRef}
      className="w-full h-full rounded-lg overflow-hidden"
      style={{ minHeight: 400 }}
    />
  );
};

export default WeatherMap;
