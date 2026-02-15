import { useState } from 'react';
import { useVenues, useOfficials, useGames, useAddVenue, useAddOfficial, useAddGame, useUpdateGame, useDeleteGame, useBulkAddGames, useGrades, useTrainings, useTrainingExceptions, useAddTraining, useAddTrainingException, Game } from '@/hooks/useData';
import { useAuth } from '@/hooks/useAuth';
import { ActiveGameCard } from '@/components/ActiveGameCard';
import { AddVenueDialog } from '@/components/AddVenueDialog';
import { AddOfficialDialog } from '@/components/AddOfficialDialog';
import { AddGameDialog } from '@/components/AddGameDialog';
import { EditGameDialog } from '@/components/EditGameDialog';
import { ImportDrawDialog, ExtractedGame } from '@/components/ImportDrawDialog';
import { ReviewImportDialog } from '@/components/ReviewImportDialog';
import { StatusBadge } from '@/components/StatusBadge';
import { GradeManager } from '@/components/GradeManager';
import { AddTrainingDialog } from '@/components/AddTrainingDialog';
import { CalendarView } from '@/components/CalendarView';
import { TrainingManager } from '@/components/TrainingManager';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Zap, MapPin, CalendarClock, Shield, LogOut, Loader2, Calendar, Pencil, Trash2, LayoutGrid, List, Thermometer, Flame, AlertTriangle } from 'lucide-react';
import { Link, Navigate } from 'react-router-dom';

const Dashboard = () => {
  const { user, isAdmin, loading: authLoading, signOut } = useAuth();
  const { data: venues = [], isLoading: venuesLoading } = useVenues();
  const { data: officials = [], isLoading: officialsLoading } = useOfficials();
  const { data: games = [], isLoading: gamesLoading } = useGames();
  const { data: grades = [], isLoading: gradesLoading } = useGrades();
  const { data: trainings = [], isLoading: trainingsLoading } = useTrainings();
  const { data: trainingExceptions = [], isLoading: exceptionsLoading } = useTrainingExceptions();

  const addVenue = useAddVenue();
  const addOfficial = useAddOfficial();
  const addGame = useAddGame();
  const updateGame = useUpdateGame();
  const deleteGame = useDeleteGame();
  const bulkAddGames = useBulkAddGames();
  const addTraining = useAddTraining();
  const addTrainingException = useAddTrainingException();

  const [editingGame, setEditingGame] = useState<Game | null>(null);
  const [extractedGames, setExtractedGames] = useState<ExtractedGame[]>([]);
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');

  const handleGamesExtracted = (games: ExtractedGame[]) => {
    setExtractedGames(games);
    setShowReviewDialog(true);
  };

  const handleConfirmImport = (games: { name: string; venue_id: string; start_time: string; end_time: string; grade_id?: string }[]) => {
    bulkAddGames.mutate(games, {
      onSuccess: () => {
        setShowReviewDialog(false);
        setExtractedGames([]);
      }
    });
  };

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

  const isLoading = venuesLoading || officialsLoading || gamesLoading || gradesLoading || trainingsLoading || exceptionsLoading;

  const handleCancelTraining = (trainingId: string, date: string, reason: string) => {
    addTrainingException.mutate({
      training_id: trainingId,
      exception_date: date,
      is_cancelled: true,
      reason: reason || undefined,
    });
  };

  // Categorize games
  const now = new Date();
  const activeGames = games.filter(g => {
    const start = new Date(g.start_time);
    const end = new Date(g.end_time);
    return now >= start && now <= end;
  });
  const upcomingGames = games.filter(g => new Date(g.start_time) > now);

  // Games this week (Mon–Sun)
  const startOfWeek = new Date(now);
  const day = startOfWeek.getDay();
  const diffToMon = day === 0 ? -6 : 1 - day;
  startOfWeek.setDate(startOfWeek.getDate() + diffToMon);
  startOfWeek.setHours(0, 0, 0, 0);
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(endOfWeek.getDate() + 7);
  const thisWeekGames = games
    .filter(g => {
      const start = new Date(g.start_time);
      const end = new Date(g.end_time);
      return start >= startOfWeek && start < endOfWeek && end > now;
    })
    .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());
  const activeThisWeek = thisWeekGames.filter(g => {
    const start = new Date(g.start_time);
    const end = new Date(g.end_time);
    return now >= start && now <= end;
  });
  const upcomingThisWeek = thisWeekGames.filter(g => new Date(g.start_time) > now);
  const pastGames = games.filter(g => new Date(g.end_time) < now);

  const statusCounts = {
    red: games.filter(g => g.status === 'red').length,
    orange: games.filter(g => g.status === 'orange').length,
    green: games.filter(g => g.status === 'green').length,
  };

  const heatCounts = {
    extreme: activeGames.filter(g => g.heat_status === 'extreme').length,
    high: activeGames.filter(g => g.heat_status === 'high').length,
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-md bg-primary/10 flex items-center justify-center">
              <Shield className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-foreground tracking-tight">GameGuard</h1>
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Game Day Safety</p>
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
              <AlertTriangle className="h-5 w-5 text-danger" />
            </div>
            <div>
              <p className="text-2xl font-bold text-danger">{statusCounts.red}</p>
              <p className="text-xs text-danger/80">Lightning Stoppages</p>
            </div>
          </Card>
        )}

        {/* Heat Stoppages Alert */}
        {heatCounts.extreme > 0 && (
          <Card className="bg-danger/10 border-danger/20 p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-danger/20 flex items-center justify-center">
              <Flame className="h-5 w-5 text-danger" />
            </div>
            <div>
              <p className="text-2xl font-bold text-danger">{heatCounts.extreme}</p>
              <p className="text-xs text-danger/80">Heat Stoppages (Extreme)</p>
            </div>
          </Card>
        )}

        {/* High Heat Warning */}
        {heatCounts.high > 0 && heatCounts.extreme === 0 && (
          <Card className="bg-orange-500/10 border-orange-500/20 p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-orange-500/20 flex items-center justify-center">
              <Thermometer className="h-5 w-5 text-orange-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-orange-500">{heatCounts.high}</p>
              <p className="text-xs text-orange-500/80">High Heat Risk Games</p>
            </div>
          </Card>
        )}

        {/* Actions */}
        {isAdmin && (
          <div className="flex items-center gap-2 flex-wrap">
            <AddVenueDialog onAdd={(v) => addVenue.mutate(v)} isPending={addVenue.isPending} />
            <AddOfficialDialog venues={venues} onAdd={(o) => addOfficial.mutate(o)} isPending={addOfficial.isPending} />
            <AddGameDialog venues={venues} grades={grades} onAdd={(g) => addGame.mutate(g)} isPending={addGame.isPending} />
            <AddTrainingDialog venues={venues} grades={grades} onAdd={(t) => addTraining.mutate(t)} isPending={addTraining.isPending} />
            <ImportDrawDialog onGamesExtracted={handleGamesExtracted} />
          </div>
        )}

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {/* Active Games */}
            {activeThisWeek.length > 0 && (
              <section>
                <h2 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
                  <Shield className="h-5 w-5 text-primary" />
                  Active Games ({activeThisWeek.length})
                </h2>
                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                  {activeThisWeek.map(game => {
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
              </section>
            )}

            {/* Games This Week */}
            <section>
              <h2 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
                <CalendarClock className="h-5 w-5 text-primary" />
                Games This Week ({upcomingThisWeek.length})
              </h2>
              {upcomingThisWeek.length > 0 ? (
                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                  {upcomingThisWeek.map(game => {
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
                  <p className="text-muted-foreground">No upcoming games this week</p>
                </Card>
              )}
            </section>

            {/* Scheduled Games with View Toggle */}
            <section>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-primary" />
                  Schedule
                </h2>
                <div className="flex items-center gap-1 bg-muted rounded-md p-1">
                  <Button 
                    variant={viewMode === 'list' ? 'secondary' : 'ghost'} 
                    size="sm" 
                    className="h-7 px-2"
                    onClick={() => setViewMode('list')}
                  >
                    <List className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant={viewMode === 'calendar' ? 'secondary' : 'ghost'} 
                    size="sm" 
                    className="h-7 px-2"
                    onClick={() => setViewMode('calendar')}
                  >
                    <LayoutGrid className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {viewMode === 'calendar' ? (
                <CalendarView 
                  games={games}
                  trainings={trainings}
                  trainingExceptions={trainingExceptions}
                  venues={venues}
                  grades={grades}
                  isAdmin={isAdmin}
                  onCancelTraining={handleCancelTraining}
                />
              ) : (
                <Card className="border-border bg-card overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border text-muted-foreground text-xs uppercase tracking-wider">
                          <th className="text-left px-4 py-3 font-medium">Game</th>
                          <th className="text-left px-4 py-3 font-medium">Grade</th>
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
                            <td colSpan={isAdmin ? 7 : 6} className="px-4 py-6 text-center text-muted-foreground">No games scheduled</td>
                          </tr>
                        ) : (
                          (() => {
                            const sortedGames = [...activeGames, ...upcomingGames.sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime()), ...pastGames.sort((a, b) => new Date(b.start_time).getTime() - new Date(a.start_time).getTime())];
                            let lastMonth = '';
                            
                            return sortedGames.map(game => {
                              const venue = venues.find(v => v.id === game.venue_id);
                              const grade = game.grade_id ? grades.find(g => g.id === game.grade_id) : null;
                              const startDate = new Date(game.start_time);
                              const endDate = new Date(game.end_time);
                              const isActive = activeGames.some(g => g.id === game.id);
                              const isPast = pastGames.some(g => g.id === game.id);
                              const monthYear = startDate.toLocaleDateString([], { month: 'long', year: 'numeric' });
                              const showMonthHeader = monthYear !== lastMonth;
                              lastMonth = monthYear;
                              
                              return (
                                <>
                                  {showMonthHeader && (
                                    <tr key={`month-${monthYear}`}>
                                      <td colSpan={isAdmin ? 7 : 6} className="pt-6 pb-2 px-4">
                                        <div className="flex items-center gap-3">
                                          <span className="text-xs font-semibold uppercase tracking-wider text-primary">{monthYear}</span>
                                          <div className="flex-1 h-px bg-border" />
                                        </div>
                                      </td>
                                    </tr>
                                  )}
                                  <tr key={game.id} className={`border-b border-border/50 last:border-0 ${isPast ? 'opacity-50' : ''}`}>
                                    <td className="px-4 py-3 font-medium text-foreground">
                                      {game.name || <span className="text-muted-foreground italic">Unnamed</span>}
                                    </td>
                                    <td className="px-4 py-3 text-muted-foreground">{grade?.name ?? '—'}</td>
                                    <td className="px-4 py-3 text-muted-foreground">{venue?.name ?? '—'}</td>
                                    <td className="px-4 py-3 text-muted-foreground">
                                      {startDate.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}
                                    </td>
                                    <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
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
                                </>
                              );
                            });
                          })()
                        )}
                      </tbody>
                    </table>
                  </div>
                </Card>
              )}
            </section>

            {/* Trainings */}
            <TrainingManager 
              trainings={trainings} 
              exceptions={trainingExceptions} 
              venues={venues} 
              grades={grades} 
              isAdmin={isAdmin} 
            />

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

        <ReviewImportDialog
          open={showReviewDialog}
          onOpenChange={setShowReviewDialog}
          extractedGames={extractedGames}
          venues={venues}
          officials={officials}
          grades={grades}
          onConfirm={handleConfirmImport}
          isPending={bulkAddGames.isPending}
        />
      </main>
    </div>
  );
};

export default Dashboard;
