import { Game, Venue, Official } from '@/hooks/useData';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { MapPin, Clock, User, Pencil, Thermometer, Calendar, ShieldCheck, AlertTriangle, Flame, Zap, Map } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';

interface ActiveGameCardProps {
  game: Game;
  venue: Venue;
  official?: Official;
  onEdit?: (game: Game) => void;
  canEdit?: boolean;
}

const lightningConfig = {
  green: { label: 'Clear', color: 'text-safe', bg: 'bg-safe/15', icon: ShieldCheck, dot: 'bg-safe' },
  orange: { label: 'Warning', color: 'text-warning', bg: 'bg-warning/15', icon: Zap, dot: 'bg-warning' },
  red: { label: 'Stop', color: 'text-danger', bg: 'bg-danger/15', icon: Zap, dot: 'bg-danger' }
} as const;

const forecastLightningConfig = {
  clear: { label: 'Clear', color: 'text-safe', bg: 'bg-safe/15', icon: ShieldCheck },
  possible: { label: 'Possible', color: 'text-warning', bg: 'bg-warning/15', icon: Zap },
  likely: { label: 'Likely', color: 'text-danger', bg: 'bg-danger/15', icon: Zap }
} as const;

const heatConfig = {
  low: { label: 'Low', color: 'text-safe', bg: 'bg-safe/15', icon: ShieldCheck },
  moderate: { label: 'Moderate', color: 'text-warning', bg: 'bg-warning/15', icon: Thermometer },
  high: { label: 'High', color: 'text-orange-500', bg: 'bg-orange-500/15', icon: AlertTriangle },
  extreme: { label: 'Extreme', color: 'text-danger', bg: 'bg-danger/15', icon: Flame }
} as const;

const lightningTooltips = {
  green: ['No strikes detected nearby', 'Normal play permitted'],
  orange: ['Lightning detected 16–30 km away', 'Be prepared to suspend play', 'Monitor conditions closely'],
  red: ['Strike detected within 16 km', '30-min "All Clear" countdown active', 'Suspend play immediately — seek shelter']
};

const forecastLightningTooltips = {
  clear: ['No thunderstorms forecast', 'Normal conditions expected'],
  possible: ['Thunderstorms possible for this day', 'Monitor conditions closer to game time'],
  likely: ['Thunderstorms likely for this day', 'Consider contingency plans', 'High chance of play disruption']
};

const heatTooltips = {
  low: ['Normal activity permitted', 'Ensure hydration available'],
  moderate: ['Pre-exercise hydration required', 'Schedule rest breaks every 20–30 mins', 'Provide shaded rest areas'],
  high: ['10-min rest breaks every 30 mins mandatory', 'Use ice towels & active cooling', 'Consider postponing non-essential activities'],
  extreme: ['SUSPEND PLAY IMMEDIATELY', 'Move all participants to cooled environment', 'Per SMA 2024 Extreme Heat Policy']
};

export const ActiveGameCard = ({ game, venue, official, onEdit, canEdit }: ActiveGameCardProps) => {
  const formatTime = (iso: string) =>
  new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const formatDay = (iso: string) =>
  new Date(iso).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });

  const gameName = game.name || venue.name;

  // Determine if game is currently active (within start-warmup to end)
  const now = new Date();
  const gameStart = new Date(new Date(game.start_time).getTime() - game.warmup_minutes * 60000);
  const gameEnd = new Date(game.end_time);
  const isActive = now >= gameStart && now <= gameEnd;

  // For active games: use real-time lightning status; for scheduled: use forecast
  const forecastKey = (game.lightning_forecast || 'clear') as keyof typeof forecastLightningConfig;
  const lc = isActive ?
  lightningConfig[game.status] :
  forecastLightningConfig[forecastKey] || forecastLightningConfig.clear;
  const lightningTips = isActive ?
  lightningTooltips[game.status] :
  forecastLightningTooltips[forecastKey] || forecastLightningTooltips.clear;
  const lightningLabel = isActive ? 'Lightning' : 'Storm Forecast';

  const hc = heatConfig[game.heat_status];
  const LightningIcon = lc.icon;
  const HeatIcon = hc.icon;

  return (
    <TooltipProvider delayDuration={200}>
      <Card className="border-border bg-card p-3 space-y-2">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-card-foreground truncate">{gameName}</h3>
              {canEdit && onEdit &&
              <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={() => onEdit(game)}>
                  <Pencil className="h-3 w-3" />
                </Button>
              }
            </div>
            {game.name &&
            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                <MapPin className="h-3 w-3" />
                {venue.name}
              </p>
            }
          </div>

          {/* Risk badges with hover tooltips */}
          <div className="flex items-center gap-1.5 shrink-0">
            <Tooltip>
              <TooltipTrigger asChild>
                <div className={cn('inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold cursor-default', lc.bg, lc.color)}>
                  <LightningIcon className="h-3 w-3" />
                  <span>⚡ {lc.label}</span>
                </div>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-[240px]">
                <p className="font-semibold text-xs mb-1">{lightningLabel}: {lc.label}</p>
                {isActive && game.last_strike_distance !== null &&
                <p className="text-xs text-muted-foreground mb-1">Last strike: {game.last_strike_distance} km away</p>
                }
                <ul className="space-y-0.5">
                  {lightningTips.map((tip, i) =>
                  <li key={i} className="text-xs text-muted-foreground flex gap-1">
                      <span>•</span><span>{tip}</span>
                    </li>
                  )}
                </ul>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <div className={cn('inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold cursor-default', hc.bg, hc.color)}>
                  <HeatIcon className="h-3 w-3" />
                  <span>🌡 {hc.label}</span>
                </div>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-[240px]">
                <p className="font-semibold text-xs mb-1">Heat Risk: {hc.label}</p>
                {game.last_temp_c !== null &&
                <p className="text-xs text-muted-foreground mb-1">{game.last_temp_c}°C / {game.last_humidity}% humidity</p>
                }
                <ul className="space-y-0.5">
                  {heatTooltips[game.heat_status].map((tip, i) =>
                  <li key={i} className="text-xs text-muted-foreground flex gap-1">
                      <span>•</span><span>{tip}</span>
                    </li>
                  )}
                </ul>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <Clock className="h-3.5 w-3.5" />
          <span>{formatDay(game.start_time)}, {formatTime(game.start_time)} – {formatTime(game.end_time)}</span>
          {official && <span className="text-muted-foreground/60">— {official.name}</span>}
        </div>

        {/* Conditions row — shows when data is available */}
        {(game.last_temp_c !== null || game.last_strike_distance !== null) &&
        <div className="flex items-center gap-3 text-xs text-muted-foreground bg-muted/50 rounded-md px-3 py-1.5">
            {game.weather_icon &&
          <img
            src={`https://cdn.aerisapi.com/wxicons/v2/${game.weather_icon}`}
            alt="Weather"
            className="h-6 w-6" />

          }
            {game.last_temp_c !== null &&
          <span className="flex items-center gap-1">
                <Thermometer className="h-3 w-3" />
                {game.last_temp_c}°C
              </span>
          }
            {game.last_humidity !== null &&
          <span className="flex items-center gap-1">
                💧 {game.last_humidity}%
              </span>
          }
            {game.last_heat_check_at &&
          <span className="ml-auto text-[10px] text-muted-foreground/60">
                {new Date(game.last_heat_check_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
          }
          </div>
        }


        {game.status === 'red' && game.countdown_end &&
        <div className="rounded-md bg-danger/10 border border-danger/20 px-3 py-2 text-xs text-danger font-medium">
            🔒 Game stopped — 30-min restart countdown active
          </div>
        }

        {isActive &&
        <div className="flex justify-end">
            <Link to={`/map?venue=${venue.id}&game=${game.id}`} className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
              <Map className="h-3 w-3" /> Map
            </Link>
          </div>
        }
      </Card>
    </TooltipProvider>);

};