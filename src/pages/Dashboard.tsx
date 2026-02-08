import { useState } from 'react';
import { mockVenues, mockOfficials, mockGames } from '@/data/mockData';
import { ActiveGameCard } from '@/components/ActiveGameCard';
import { AddVenueDialog } from '@/components/AddVenueDialog';
import { AddOfficialDialog } from '@/components/AddOfficialDialog';
import { StatusBadge } from '@/components/StatusBadge';
import { Card } from '@/components/ui/card';
import { Zap, MapPin, Users, CalendarClock, Shield } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Venue, Official, LightningStatus } from '@/types/lightning';

const Dashboard = () => {
  const [venues, setVenues] = useState<Venue[]>(mockVenues);
  const [officials, setOfficials] = useState<Official[]>(mockOfficials);
  const games = mockGames;

  const statusCounts: Record<LightningStatus, number> = {
    red: games.filter(g => g.status === 'red').length,
    orange: games.filter(g => g.status === 'orange').length,
    green: games.filter(g => g.status === 'green').length,
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-md bg-primary/10 flex items-center justify-center">
              <Zap className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-foreground tracking-tight">StrikeGuard</h1>
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Lightning Safety</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/status">
              <Button variant="outline" size="sm" className="gap-1.5 text-xs">
                <Shield className="h-3.5 w-3.5" /> Live Status
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card className="bg-card border-border p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <MapPin className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{venues.length}</p>
              <p className="text-xs text-muted-foreground">Venues</p>
            </div>
          </Card>
          <Card className="bg-card border-border p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <CalendarClock className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{games.length}</p>
              <p className="text-xs text-muted-foreground">Active Games</p>
            </div>
          </Card>
          <Card className="bg-card border-border p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-danger/10 flex items-center justify-center">
              <Zap className="h-5 w-5 text-danger" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{statusCounts.red}</p>
              <p className="text-xs text-muted-foreground">Stoppages</p>
            </div>
          </Card>
          <Card className="bg-card border-border p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-safe/10 flex items-center justify-center">
              <Users className="h-5 w-5 text-safe" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{officials.length}</p>
              <p className="text-xs text-muted-foreground">Officials</p>
            </div>
          </Card>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <AddVenueDialog onAdd={(v) => setVenues(prev => [...prev, { ...v, id: String(Date.now()) }])} />
          <AddOfficialDialog venues={venues} onAdd={(o) => setOfficials(prev => [...prev, { ...o, id: String(Date.now()), alertsEnabled: true }])} />
        </div>

        {/* Active Games */}
        <section>
          <h2 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
            <CalendarClock className="h-5 w-5 text-primary" />
            Active Games
          </h2>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {games.map(game => {
              const venue = venues.find(v => v.id === game.venueId);
              const official = officials.find(o => o.venueId === game.venueId);
              if (!venue) return null;
              return <ActiveGameCard key={game.id} game={game} venue={venue} official={official} />;
            })}
          </div>
        </section>

        {/* Venues Table */}
        <section>
          <h2 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            All Venues
          </h2>
          <Card className="border-border bg-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-muted-foreground text-xs uppercase tracking-wider">
                    <th className="text-left px-4 py-3 font-medium">Venue</th>
                    <th className="text-left px-4 py-3 font-medium">Coordinates</th>
                    <th className="text-left px-4 py-3 font-medium">Safe Zone</th>
                    <th className="text-left px-4 py-3 font-medium">Assigned Official</th>
                    <th className="text-left px-4 py-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {venues.map(venue => {
                    const official = officials.find(o => o.venueId === venue.id);
                    const game = games.find(g => g.venueId === venue.id);
                    return (
                      <tr key={venue.id} className="border-b border-border/50 last:border-0">
                        <td className="px-4 py-3 font-medium text-foreground">{venue.name}</td>
                        <td className="px-4 py-3 text-muted-foreground font-mono text-xs">{venue.latitude.toFixed(4)}, {venue.longitude.toFixed(4)}</td>
                        <td className="px-4 py-3 text-muted-foreground">{venue.safeZoneRadius} km</td>
                        <td className="px-4 py-3 text-muted-foreground">{official?.name ?? '—'}</td>
                        <td className="px-4 py-3">{game ? <StatusBadge status={game.status} size="sm" /> : <span className="text-xs text-muted-foreground">Inactive</span>}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </section>
      </main>
    </div>
  );
};

export default Dashboard;
