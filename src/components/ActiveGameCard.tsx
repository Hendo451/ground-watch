import { Game, Venue, Official } from '@/types/lightning';
import { StatusBadge } from './StatusBadge';
import { Card } from '@/components/ui/card';
import { MapPin, Clock, Zap, User } from 'lucide-react';

interface ActiveGameCardProps {
  game: Game;
  venue: Venue;
  official?: Official;
}

export const ActiveGameCard = ({ game, venue, official }: ActiveGameCardProps) => {
  const formatTime = (iso: string) =>
    new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <Card className="border-border bg-card p-4 space-y-3">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-semibold text-card-foreground">{venue.name}</h3>
          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
            <MapPin className="h-3 w-3" />
            {venue.latitude.toFixed(4)}, {venue.longitude.toFixed(4)}
          </p>
        </div>
        <StatusBadge status={game.status} />
      </div>

      <div className="grid grid-cols-2 gap-2 text-sm">
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <Clock className="h-3.5 w-3.5" />
          <span>{formatTime(game.startTime)} – {formatTime(game.endTime)}</span>
        </div>
        {game.lastStrikeDistance !== null && (
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Zap className="h-3.5 w-3.5 text-warning" />
            <span>{game.lastStrikeDistance} km</span>
          </div>
        )}
      </div>

      {official && (
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground border-t border-border pt-2">
          <User className="h-3 w-3" />
          <span>{official.name} · {official.mobile}</span>
        </div>
      )}

      {game.status === 'red' && game.countdownEnd && (
        <div className="rounded-md bg-danger/10 border border-danger/20 px-3 py-2 text-xs text-danger font-medium">
          🔒 Game stopped — 30-min restart countdown active
        </div>
      )}
    </Card>
  );
};
