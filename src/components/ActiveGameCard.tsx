import { Game, Venue, Official } from '@/hooks/useData';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { MapPin, Clock, Zap, User, Pencil, Thermometer, Calendar, ShieldCheck, AlertTriangle, Flame } from 'lucide-react';
import { cn } from '@/lib/utils';

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
  red: { label: 'Stop', color: 'text-danger', bg: 'bg-danger/15', icon: Zap, dot: 'bg-danger' },
} as const;

const heatConfig = {
  low: { label: 'Low', color: 'text-safe', bg: 'bg-safe/15', icon: ShieldCheck },
  moderate: { label: 'Moderate', color: 'text-warning', bg: 'bg-warning/15', icon: Thermometer },
  high: { label: 'High', color: 'text-orange-500', bg: 'bg-orange-500/15', icon: AlertTriangle },
  extreme: { label: 'Extreme', color: 'text-danger', bg: 'bg-danger/15', icon: Flame },
} as const;

const lightningTooltips = {
  green: ['No strikes detected nearby', 'Normal play permitted'],
  orange: ['Lightning detected 16–30 km away', 'Be prepared to suspend play', 'Monitor conditions closely'],
  red: ['Strike detected within 16 km', '30-min "All Clear" countdown active', 'Suspend play immediately — seek shelter'],
};

const heatTooltips = {
  low: ['Normal activity permitted', 'Ensure hydration available'],
  moderate: ['Pre-exercise hydration required', 'Schedule rest breaks every 20–30 mins', 'Provide shaded rest areas'],
  high: ['10-min rest breaks every 30 mins mandatory', 'Use ice towels & active cooling', 'Consider postponing non-essential activities'],
  extreme: ['SUSPEND PLAY IMMEDIATELY', 'Move all participants to cooled environment', 'Per SMA 2024 Extreme Heat Policy'],
};

export const ActiveGameCard = ({ game, venue, official, onEdit, canEdit }: ActiveGameCardProps) => {
  const formatTime = (iso: string) =>
    new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const formatDay = (iso: string) =>
    new Date(iso).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });

  const gameName = game.name || venue.name;
  const lc = lightningConfig[game.status];
  const hc = heatConfig[game.heat_status];
  const LightningIcon = lc.icon;
  const HeatIcon = hc.icon;

  return (
    <TooltipProvider delayDuration={200}>
      <Card className="border-border bg-card p-4 space-y-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-card-foreground truncate">{gameName}</h3>
              {canEdit && onEdit && (
                <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={() => onEdit(game)}>
                  <Pencil className="h-3 w-3" />
                </Button>
              )}
            </div>
            {game.name && (
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                <MapPin className="h-3 w-3" />
                {venue.name}
              </p>
            )}
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
                <p className="font-semibold text-xs mb-1">Lightning Risk: {lc.label}</p>
                {game.last_strike_distance !== null && (
                  <p className="text-xs text-muted-foreground mb-1">Last strike: {game.last_strike_distance} km away</p>
                )}
                <ul className="space-y-0.5">
                  {lightningTooltips[game.status].map((tip, i) => (
                    <li key={i} className="text-xs text-muted-foreground flex gap-1">
                      <span>•</span><span>{tip}</span>
                    </li>
                  ))}
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
                {game.last_temp_c !== null && (
                  <p className="text-xs text-muted-foreground mb-1">{game.last_temp_c}°C / {game.last_humidity}% humidity</p>
                )}
                <ul className="space-y-0.5">
                  {heatTooltips[game.heat_status].map((tip, i) => (
                    <li key={i} className="text-xs text-muted-foreground flex gap-1">
                      <span>•</span><span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Calendar className="h-3.5 w-3.5" />
            <span>{formatDay(game.start_time)}</span>
          </div>
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Clock className="h-3.5 w-3.5" />
            <span>{formatTime(game.start_time)} – {formatTime(game.end_time)}</span>
          </div>
        </div>

        {official && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground border-t border-border pt-2">
            <User className="h-3 w-3" />
            <span>{official.name} · {official.mobile}</span>
          </div>
        )}

        {game.status === 'red' && game.countdown_end && (
          <div className="rounded-md bg-danger/10 border border-danger/20 px-3 py-2 text-xs text-danger font-medium">
            🔒 Game stopped — 30-min restart countdown active
          </div>
        )}
      </Card>
    </TooltipProvider>
  );
};
