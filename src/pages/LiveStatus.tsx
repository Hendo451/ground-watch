import { useGames, useVenues } from '@/hooks/useData';
import { CountdownTimer } from '@/components/CountdownTimer';
import { StatusBadge } from '@/components/StatusBadge';
import { Card } from '@/components/ui/card';
import { Zap, ArrowLeft, ShieldCheck, Car, Building2, Fence, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const LiveStatus = () => {
  const { data: games = [], isLoading: gamesLoading } = useGames();
  const { data: venues = [], isLoading: venuesLoading } = useVenues();

  const isLoading = gamesLoading || venuesLoading;

  // Get active games (within time window)
  const now = new Date();
  const activeGames = games.filter(g => {
    const start = new Date(g.start_time);
    const end = new Date(g.end_time);
    return now >= start && now <= end;
  });

  const redGames = activeGames.filter(g => g.status === 'red');

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/">
              <Button variant="ghost" size="sm" className="gap-1.5">
                <ArrowLeft className="h-4 w-4" /> Dashboard
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary" />
              <h1 className="text-sm font-bold text-foreground">Live Lightning Status</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-8 max-w-3xl">
        {/* Countdown Timers */}
        {redGames.length > 0 ? (
          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-danger flex items-center gap-2">
              <Zap className="h-5 w-5" /> Active Stoppages
            </h2>
            {redGames.map(game => {
              const venue = venues.find(v => v.id === game.venue_id);
              if (!venue || !game.countdown_end) return null;
              return <CountdownTimer key={game.id} targetTime={game.countdown_end} venueName={venue.name} />;
            })}
          </section>
        ) : (
          <Card className="bg-safe/5 border-safe/20 p-8 text-center space-y-2">
            <ShieldCheck className="h-12 w-12 text-safe mx-auto" />
            <h2 className="text-2xl font-bold text-safe">All Clear</h2>
            <p className="text-muted-foreground">No active stoppages across all venues</p>
          </Card>
        )}

        {/* All Venue Statuses */}
        {activeGames.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">Active Venues</h2>
            <div className="grid gap-2">
              {activeGames.map(game => {
                const venue = venues.find(v => v.id === game.venue_id);
                if (!venue) return null;
                return (
                  <Card key={game.id} className="bg-card border-border p-4 flex items-center justify-between">
                    <span className="font-medium text-foreground">{venue.name}</span>
                    <StatusBadge status={game.status} />
                  </Card>
                );
              })}
            </div>
          </section>
        )}

        {/* Safety Tips */}
        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" /> Safety Information
          </h2>
          <Card className="bg-card border-border p-5 space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-1">What is a Faraday Cage?</h3>
              <p className="text-sm text-muted-foreground">
                A Faraday cage is an enclosure made of conductive material that blocks electromagnetic fields. 
                During a lightning event, enclosed vehicles and solid buildings act as Faraday cages, safely 
                conducting electrical charge around the outside.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="rounded-lg bg-safe/5 border border-safe/20 p-3 text-center">
                <Car className="h-6 w-6 text-safe mx-auto mb-1" />
                <p className="text-xs font-medium text-safe">Enclosed Vehicles</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">Windows up, don't touch metal</p>
              </div>
              <div className="rounded-lg bg-safe/5 border border-safe/20 p-3 text-center">
                <Building2 className="h-6 w-6 text-safe mx-auto mb-1" />
                <p className="text-xs font-medium text-safe">Solid Buildings</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">Stay away from windows</p>
              </div>
              <div className="rounded-lg bg-danger/5 border border-danger/20 p-3 text-center">
                <Fence className="h-6 w-6 text-danger mx-auto mb-1" />
                <p className="text-xs font-medium text-danger">Avoid Fences & Poles</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">Metal conducts lightning</p>
              </div>
            </div>
          </Card>
        </section>
      </main>
    </div>
  );
};

export default LiveStatus;
