import { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Game, Venue, LightningStrike } from '@/hooks/useData';
import { HeatRiskGauge } from '@/components/HeatRiskGauge';
import { CATEGORY_LABELS, getThresholdsForCategory } from '@/lib/sportCategories';
import { SportIntensity } from '@/lib/sportCategories';
import { cn } from '@/lib/utils';
import { Info, Zap } from 'lucide-react';

interface GameDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  game: Game;
  venue: Venue;
  isActive: boolean;
  strikes?: LightningStrike[];
}

function createCircleGeoJSON(lat: number, lng: number, radiusKm: number, points = 64) {
  const coords: [number, number][] = [];
  const earthRadiusKm = 6371;
  for (let i = 0; i <= points; i++) {
    const angle = (i / points) * 2 * Math.PI;
    const dLat = (radiusKm / earthRadiusKm) * (180 / Math.PI);
    const dLng = dLat / Math.cos((lat * Math.PI) / 180);
    coords.push([lng + dLng * Math.cos(angle), lat + dLat * Math.sin(angle)]);
  }
  return { type: 'Feature' as const, geometry: { type: 'Polygon' as const, coordinates: [coords] }, properties: {} };
}

const mitigationGuidance: Record<string, string[]> = {
  low: ['Normal activity permitted', 'Ensure adequate hydration available'],
  moderate: ['Ensure pre-exercise hydration', 'Schedule rest breaks every 20-30 minutes', 'Provide shaded rest areas'],
  high: ['Mandatory 10-min rest breaks every 30 mins', 'Use ice towels and active cooling', 'Consider postponing non-essential activities'],
  extreme: ['Suspension of play should be considered', 'Move participants to a cooled environment', 'Implement emergency cooling protocols if needed'],
};

export const GameDetailsDialog = ({ open, onOpenChange, game, venue, isActive, strikes = [] }: GameDetailsDialogProps) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);

  const intensity: SportIntensity = game.sport_intensity || venue.sport_intensity || 'category_1';
  const thresholds = getThresholdsForCategory(intensity);
  const categoryLabel = CATEGORY_LABELS[intensity];
  const sportName = venue.default_sport;
  const guidance = mitigationGuidance[game.heat_status] || mitigationGuidance.low;

  // Lightning surveillance time for upcoming games
  const warmupStart = new Date(new Date(game.start_time).getTime() - game.warmup_minutes * 60000);
  const formatTime = (d: Date) => d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const formatDay = (d: Date) => d.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });

  useEffect(() => {
    if (!open || !mapContainerRef.current) return;

    // Small delay to let sheet animate open
    const timer = setTimeout(() => {
      if (!mapContainerRef.current || mapRef.current) return;

      const map = new maplibregl.Map({
        container: mapContainerRef.current,
        style: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
        center: [venue.longitude, venue.latitude],
        zoom: 12,
        attributionControl: false,
      });

      mapRef.current = map;

      map.on('load', () => {
        // Venue marker
        const el = document.createElement('div');
        el.innerHTML = `<div style="width:14px;height:14px;background:hsl(45,93%,47%);border:2px solid white;border-radius:50%;box-shadow:0 0 8px rgba(234,179,8,0.6)"></div>`;
        new maplibregl.Marker({ element: el }).setLngLat([venue.longitude, venue.latitude]).addTo(map);

        if (isActive) {
          // Safety radius
          map.addSource('radius', { type: 'geojson', data: createCircleGeoJSON(venue.latitude, venue.longitude, venue.safe_zone_radius) as any });
          map.addLayer({ id: 'radius-fill', type: 'fill', source: 'radius', paint: { 'fill-color': '#ef4444', 'fill-opacity': 0.08 } });
          map.addLayer({ id: 'radius-line', type: 'line', source: 'radius', paint: { 'line-color': '#ef4444', 'line-width': 2, 'line-dasharray': [4, 3], 'line-opacity': 0.6 } });

          // Strikes
          if (strikes.length > 0) {
            const now = Date.now();
            const features = strikes.map(s => ({
              type: 'Feature' as const,
              geometry: { type: 'Point' as const, coordinates: [s.longitude, s.latitude] },
              properties: { recent: now - new Date(s.detected_at).getTime() < 600000 },
            }));
            map.addSource('strikes', { type: 'geojson', data: { type: 'FeatureCollection', features } as any });
            map.addLayer({ id: 'strikes-dot', type: 'circle', source: 'strikes', paint: { 'circle-radius': 5, 'circle-color': ['case', ['get', 'recent'], '#f97316', '#f9731688'], 'circle-stroke-color': '#fff', 'circle-stroke-width': 1 } });
          }

          map.setZoom(10);
        }
      });
    }, 150);

    return () => {
      clearTimeout(timer);
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, [open, venue, isActive, strikes]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[85vh] overflow-y-auto rounded-t-xl p-0">
        <SheetHeader className="px-5 pt-5 pb-3">
          <SheetTitle className="text-base">{game.name || venue.name} — Details</SheetTitle>
        </SheetHeader>

        {/* Map */}
        <div ref={mapContainerRef} className="w-full h-48 sm:h-56" />

        <div className="px-5 py-4 space-y-5">
          {/* Heat Risk Gauge */}
          <section className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground">Heat Risk Assessment</h3>
            <HeatRiskGauge status={game.heat_status} tempC={game.last_temp_c} humidity={game.last_humidity} />
          </section>

          {/* Sport & category */}
          <section className="space-y-2">
            <div className="text-xs text-muted-foreground">
              {sportName && <span className="font-medium text-foreground">{sportName}</span>}
              {sportName && ' — '}
              {categoryLabel}
            </div>

            {/* Thresholds table */}
            <div className="border border-border rounded-md overflow-hidden text-xs">
              <div className="grid grid-cols-3 bg-muted/50 px-3 py-1.5 font-semibold text-muted-foreground">
                <span>Level</span>
                <span className="col-span-2">SMA 2024 Thresholds</span>
              </div>
              {thresholds.map(t => (
                <div
                  key={t.level}
                  className={cn(
                    'grid grid-cols-3 px-3 py-2 border-t border-border',
                    game.heat_status === t.level && 'bg-primary/5'
                  )}
                >
                  <span className={cn(
                    'font-medium capitalize',
                    t.level === 'moderate' && 'text-warning',
                    t.level === 'high' && 'text-orange-500',
                    t.level === 'extreme' && 'text-danger',
                  )}>{t.label}</span>
                  <div className="col-span-2 space-y-0.5 text-muted-foreground">
                    {t.conditions.map((c, i) => (
                      <div key={i}>{c}</div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Mitigation guidance */}
          <section className="space-y-2">
            <h4 className="text-xs font-semibold text-foreground">Recommended Actions</h4>
            <ul className="space-y-1">
              {guidance.map((item, i) => (
                <li key={i} className={cn(
                  'text-xs flex items-start gap-1.5',
                  game.heat_status === 'extreme' ? 'text-danger' : 'text-muted-foreground'
                )}>
                  <span className="mt-0.5">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* Lightning surveillance notice (upcoming only) */}
          {!isActive && (
            <section className="rounded-md bg-primary/10 border border-primary/20 px-3 py-2.5 flex items-start gap-2">
              <Zap className="h-4 w-4 text-primary shrink-0 mt-0.5" />
              <div className="text-xs text-foreground">
                <span className="font-semibold">Lightning surveillance</span> will begin at{' '}
                <span className="font-medium">{formatTime(warmupStart)}</span> on{' '}
                <span className="font-medium">{formatDay(warmupStart)}</span>
              </div>
            </section>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};
