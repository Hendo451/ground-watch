import { Game, Venue, Official } from '@/hooks/useData';
import { StatusBadge } from './StatusBadge';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MapPin, Clock, Zap, User, Pencil } from 'lucide-react';

interface ActiveGameCardProps {
  game: Game;
  venue: Venue;
  official?: Official;
  onEdit?: (game: Game) => void;
  canEdit?: boolean;
}

export const ActiveGameCard = ({ game, venue, official, onEdit, canEdit }: ActiveGameCardProps) => {
  const formatTime = (iso: string) =>
    new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const gameName = game.name || venue.name;

  return (
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
        <StatusBadge status={game.status} />
      </div>

      <div className="grid grid-cols-2 gap-2 text-sm">
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <Clock className="h-3.5 w-3.5" />
          <span>{formatTime(game.start_time)} – {formatTime(game.end_time)}</span>
        </div>
        {game.last_strike_distance !== null && (
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Zap className="h-3.5 w-3.5 text-warning" />
            <span>{game.last_strike_distance} km</span>
          </div>
        )}
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
  );
};
