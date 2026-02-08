import { useState } from 'react';
import { useVenues, useOfficials, useGames, useAddVenue, useAddOfficial, useAddGame, useUpdateGame, useDeleteGame, Game } from '@/hooks/useData';
import { useAuth } from '@/hooks/useAuth';
import { ActiveGameCard } from '@/components/ActiveGameCard';
import { AddVenueDialog } from '@/components/AddVenueDialog';
import { AddOfficialDialog } from '@/components/AddOfficialDialog';
import { AddGameDialog } from '@/components/AddGameDialog';
import { EditGameDialog } from '@/components/EditGameDialog';
import { StatusBadge } from '@/components/StatusBadge';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Zap, MapPin, CalendarClock, Shield, LogOut, Loader2, Calendar, Pencil, Trash2 } from 'lucide-react';
import { Link, Navigate } from 'react-router-dom';

const Dashboard = () => {
  const { user, isAdmin, loading: authLoading, signOut } = useAuth();
  const { data: venues = [], isLoading: venuesLoading } = useVenues();
  const { data: officials = [], isLoading: officialsLoading } = useOfficials();
  const { data: games = [], isLoading: gamesLoading } = useGames();

  const addVenue = useAddVenue();
  const addOfficial = useAddOfficial();
  const addGame = useAddGame();
  const updateGame = useUpdateGame();
  const deleteGame = useDeleteGame();

  const [editingGame, setEditingGame] = useState<Game | null>(null);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  const isLoading = venuesLoading || officialsLoading || gamesLoading;

  // Categorize games
  const now = new Date();
  const activeGames = games.filter(g => {
    const start = new Date(g.start_time);
    const end = new Date(g.end_time);
    return now >= start && now <= end;
  });
  const upcomingGames = games.filter(g => new Date(g.start_time) > now);
  const pastGames = games.filter(g => new Date(g.end_time) < now);

  const statusCounts = {
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
            <Button variant="ghost" size="sm" onClick={signOut} className="gap-1.5 text-xs">
              <LogOut className="h-3.5 w-3.5" /> Sign Out
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Admin notice */}
        {!isAdmin && (
          <Card className="bg-warning/10 border-warning/20 p-4">
            <p className="text-sm text-warning">You have viewer access. Contact an admin to get write permissions.</p>
          </Card>
        )}

        {/* Stoppages Alert */}
        {statusCounts.red > 0 && (
          <Card className="bg-danger/10 border-danger/20 p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-danger/20 flex items-center justify-center">
              <Zap className="h-5 w-5 text-danger" />
            </div>
            <div>
              <p className="text-2xl font-bold text-danger">{statusCounts.red}</p>
              <p className="text-xs text-danger/80">Active Stoppages</p>
            </div>
          </Card>
        )}

        {/* Actions */}
        {isAdmin && (
          <div className="flex items-center gap-2 flex-wrap">
            <AddVenueDialog onAdd={(v) => addVenue.mutate(v)} isPending={addVenue.isPending} />
            <AddOfficialDialog venues={venues} onAdd={(o) => addOfficial.mutate(o)} isPending={addOfficial.isPending} />
            <AddGameDialog venues={venues} onAdd={(g) => addGame.mutate(g)} isPending={addGame.isPending} />
          </div>
        )}

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {/* Active Games */}
            <section>
              <h2 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
                <CalendarClock className="h-5 w-5 text-primary" />
                Active Games ({activeGames.length})
              </h2>
              {activeGames.length > 0 ? (
                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                  {activeGames.map(game => {
                    const venue = venues.find(v => v.id === game.venue_id);
                    const official = officials.find(o => o.venue_id === game.venue_id);
                    if (!venue) return null;
                    return (
                      <ActiveGameCard 
                        key={game.id} 
                        game={game} 
                        venue={venue} 
                        official={official}
                        canEdit={isAdmin}
                        onEdit={setEditingGame}
                      />
                    );
                  })}
                </div>
              ) : (
                <Card className="bg-card border-border p-6 text-center">
                  <p className="text-muted-foreground">No active games right now</p>
                </Card>
              )}
            </section>

            {/* Scheduled Games */}
            <section>
              <h2 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                Scheduled Games ({games.length})
              </h2>
              <Card className="border-border bg-card overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border text-muted-foreground text-xs uppercase tracking-wider">
                        <th className="text-left px-4 py-3 font-medium">Game</th>
                        <th className="text-left px-4 py-3 font-medium">Venue</th>
                        <th className="text-left px-4 py-3 font-medium">Date</th>
                        <th className="text-left px-4 py-3 font-medium">Time</th>
                        <th className="text-left px-4 py-3 font-medium">Status</th>
                        {isAdmin && <th className="text-left px-4 py-3 font-medium">Actions</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {games.length === 0 ? (
                        <tr>
                          <td colSpan={isAdmin ? 6 : 5} className="px-4 py-6 text-center text-muted-foreground">No games scheduled</td>
                        </tr>
                      ) : (
                        [...upcomingGames, ...activeGames, ...pastGames].map(game => {
                          const venue = venues.find(v => v.id === game.venue_id);
                          const startDate = new Date(game.start_time);
                          const endDate = new Date(game.end_time);
                          const isActive = activeGames.some(g => g.id === game.id);
                          const isPast = pastGames.some(g => g.id === game.id);
                          return (
                            <tr key={game.id} className={`border-b border-border/50 last:border-0 ${isPast ? 'opacity-50' : ''}`}>
                              <td className="px-4 py-3 font-medium text-foreground">
                                {game.name || <span className="text-muted-foreground italic">Unnamed</span>}
                              </td>
                              <td className="px-4 py-3 text-muted-foreground">{venue?.name ?? '—'}</td>
                              <td className="px-4 py-3 text-muted-foreground">
                                {startDate.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}
                              </td>
                              <td className="px-4 py-3 text-muted-foreground">
                                {startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} – {endDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </td>
                              <td className="px-4 py-3">
                                {isActive ? (
                                  <StatusBadge status={game.status} size="sm" />
                                ) : isPast ? (
                                  <span className="text-xs text-muted-foreground">Completed</span>
                                ) : (
                                  <span className="text-xs text-muted-foreground">Upcoming</span>
                                )}
                              </td>
                              {isAdmin && (
                                <td className="px-4 py-3">
                                  <div className="flex items-center gap-1">
                                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setEditingGame(game)}>
                                      <Pencil className="h-3.5 w-3.5" />
                                    </Button>
                                    <Button 
                                      variant="ghost" 
                                      size="icon" 
                                      className="h-7 w-7 text-destructive hover:text-destructive" 
                                      onClick={() => {
                                        if (confirm('Delete this game?')) {
                                          deleteGame.mutate(game.id);
                                        }
                                      }}
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </Button>
                                  </div>
                                </td>
                              )}
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </Card>
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
                        <th className="text-left px-4 py-3 font-medium">Safe Zone</th>
                        <th className="text-left px-4 py-3 font-medium">Assigned Official</th>
                        <th className="text-left px-4 py-3 font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {venues.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="px-4 py-6 text-center text-muted-foreground">No venues yet</td>
                        </tr>
                      ) : (
                        venues.map(venue => {
                          const official = officials.find(o => o.venue_id === venue.id);
                          const game = games.find(g => g.venue_id === venue.id);
                          return (
                            <tr key={venue.id} className="border-b border-border/50 last:border-0">
                              <td className="px-4 py-3 font-medium text-foreground">{venue.name}</td>
                              <td className="px-4 py-3 text-muted-foreground">{venue.safe_zone_radius} km</td>
                              <td className="px-4 py-3 text-muted-foreground">{official?.name ?? '—'}</td>
                              <td className="px-4 py-3">{game ? <StatusBadge status={game.status} size="sm" /> : <span className="text-xs text-muted-foreground">No game</span>}</td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </Card>
            </section>
          </>
        )}

        <EditGameDialog
          game={editingGame}
          open={!!editingGame}
          onOpenChange={(open) => !open && setEditingGame(null)}
          onSave={(data) => {
            updateGame.mutate(data, {
              onSuccess: () => setEditingGame(null)
            });
          }}
          isPending={updateGame.isPending}
        />
      </main>
    </div>
  );
};

export default Dashboard;
