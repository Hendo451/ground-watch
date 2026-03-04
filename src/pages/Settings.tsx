import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useSettings, useUpdateSettings } from '@/hooks/useSettings';
import { useVenues, useOfficials, useGrades, useAddGrade, useUpdateGrade, useDeleteGrade, useAddVenue, useAddOfficial, useUpdateVenue, useDeleteVenue, useUpdateOfficial, useDeleteOfficial, Venue, Official, Grade } from '@/hooks/useData';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ArrowLeft, Loader2, Save, MapPin, Users, Tags, Plus, Pencil, Trash2, ChevronDown, Phone, Bell, BellOff } from 'lucide-react';
import { AddVenueDialog } from '@/components/AddVenueDialog';
import { AddOfficialDialog } from '@/components/AddOfficialDialog';
import { EditVenueDialog } from '@/components/EditVenueDialog';
import { EditOfficialDialog } from '@/components/EditOfficialDialog';
import { Link, Navigate } from 'react-router-dom';
import { toast } from 'sonner';
import { SPORT_CATEGORIES, CATEGORY_LABELS, getCategoryForSport } from '@/lib/sportCategories';

const Settings = () => {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const { data: settings, isLoading: settingsLoading } = useSettings();
  const { data: venues = [] } = useVenues();
  const { data: officials = [] } = useOfficials();
  const { data: grades = [] } = useGrades();
  const updateSettings = useUpdateSettings();
  const addVenue = useAddVenue();
  const addOfficial = useAddOfficial();
  const updateVenue = useUpdateVenue();
  const deleteVenue = useDeleteVenue();
  const updateOfficial = useUpdateOfficial();
  const deleteOfficial = useDeleteOfficial();
  const addGrade = useAddGrade();
  const updateGrade = useUpdateGrade();
  const deleteGrade = useDeleteGrade();

  const [warmup, setWarmup] = useState(45);
  const [upcomingDays, setUpcomingDays] = useState(7);
  const [countdownMins, setCountdownMins] = useState(30);
  const [smsEnabled, setSmsEnabled] = useState(true);
  const [defaultSport, setDefaultSport] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);

  const [venuesOpen, setVenuesOpen] = useState(false);
  const [officialsOpen, setOfficialsOpen] = useState(false);
  const [gradesOpen, setGradesOpen] = useState(false);
  const [editingVenue, setEditingVenue] = useState<Venue | null>(null);
  const [editingOfficial, setEditingOfficial] = useState<Official | null>(null);
  const [editingGrade, setEditingGrade] = useState<Grade | null>(null);
  const [addGradeOpen, setAddGradeOpen] = useState(false);
  const [gradeName, setGradeName] = useState('');

  useEffect(() => {
    if (settings) {
      setWarmup(settings.default_warmup_minutes);
      setUpcomingDays(settings.upcoming_days_window);
      setCountdownMins(settings.countdown_duration_minutes);
      setSmsEnabled(settings.sms_alerts_enabled);
      setDefaultSport(settings.default_sport);
      setDirty(false);
    }
  }, [settings]);

  if (authLoading || settingsLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return <Navigate to="/auth" replace />;

  const handleSave = () => {
    if (!settings) return;
    updateSettings.mutate({
      id: settings.id,
      default_warmup_minutes: warmup,
      upcoming_days_window: upcomingDays,
      countdown_duration_minutes: countdownMins,
      sms_alerts_enabled: smsEnabled,
      default_sport: defaultSport,
    }, {
      onSuccess: () => setDirty(false),
    });
  };

  const markDirty = () => setDirty(true);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/">
              <Button variant="ghost" size="sm" className="gap-1.5 text-xs">
                <ArrowLeft className="h-3.5 w-3.5" /> Back
              </Button>
            </Link>
            <h1 className="text-sm font-bold text-foreground">Settings</h1>
          </div>
          {isAdmin && dirty && (
            <Button size="sm" onClick={handleSave} disabled={updateSettings.isPending} className="gap-1.5 text-xs">
              {updateSettings.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
              Save Changes
            </Button>
          )}
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6 max-w-2xl">
        {/* Default Warm-up Period */}
        <Card className="p-6 space-y-4">
          <div>
            <h2 className="text-sm font-semibold text-foreground">Default Warm-up Period</h2>
            <p className="text-xs text-muted-foreground mt-1">
              Games become "Active" this many minutes before their start time. Applied as the default when creating new games.
            </p>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-xs">Minutes before kick-off</Label>
              <span className="text-sm font-mono font-medium text-foreground">{warmup} min</span>
            </div>
            <Slider
              value={[warmup]}
              onValueChange={([v]) => { setWarmup(v); markDirty(); }}
              min={0}
              max={120}
              step={5}
              disabled={!isAdmin}
            />
            <div className="flex justify-between text-[10px] text-muted-foreground">
              <span>0 min</span>
              <span>120 min</span>
            </div>
          </div>
        </Card>

        {/* Upcoming Games Window */}
        <Card className="p-6 space-y-4">
          <div>
            <h2 className="text-sm font-semibold text-foreground">Upcoming Games Window</h2>
            <p className="text-xs text-muted-foreground mt-1">
              How many days ahead to show in the dashboard "Upcoming Games" section.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Input
              type="number"
              value={upcomingDays}
              onChange={(e) => { setUpcomingDays(Number(e.target.value)); markDirty(); }}
              min={1}
              max={30}
              className="w-20"
              disabled={!isAdmin}
            />
            <span className="text-sm text-muted-foreground">days</span>
          </div>
        </Card>

        {/* Countdown Duration */}
        <Card className="p-6 space-y-4">
          <div>
            <h2 className="text-sm font-semibold text-foreground">Lightning Countdown Duration</h2>
            <p className="text-xs text-muted-foreground mt-1">
              Minutes to count down after the last lightning strike before play can resume.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Input
              type="number"
              value={countdownMins}
              onChange={(e) => { setCountdownMins(Number(e.target.value)); markDirty(); }}
              min={10}
              max={60}
              className="w-20"
              disabled={!isAdmin}
            />
            <span className="text-sm text-muted-foreground">minutes</span>
          </div>
        </Card>

        {/* SMS Alerts */}
        <Card className="p-6 space-y-4">
          <div>
            <h2 className="text-sm font-semibold text-foreground">Notification Preferences</h2>
            <p className="text-xs text-muted-foreground mt-1">
              Global toggle for SMS alerts. Individual officials can also be toggled separately.
            </p>
          </div>
          <div className="flex items-center justify-between">
            <Label className="text-xs">SMS alerts enabled</Label>
            <Switch
              checked={smsEnabled}
              onCheckedChange={(v) => { setSmsEnabled(v); markDirty(); }}
              disabled={!isAdmin}
            />
          </div>
        </Card>

        {/* Default Sport */}
        <Card className="p-6 space-y-4">
          <div>
            <h2 className="text-sm font-semibold text-foreground">Default Sport</h2>
            <p className="text-xs text-muted-foreground mt-1">
              Pre-selects this sport when creating new venues. Can be overridden per venue.
            </p>
          </div>
          <Select value={defaultSport ?? ''} onValueChange={(v) => { setDefaultSport(v); markDirty(); }} disabled={!isAdmin}>
            <SelectTrigger>
              <SelectValue placeholder="Select default sport" />
            </SelectTrigger>
            <SelectContent>
              {SPORT_CATEGORIES.map(s => (
                <SelectItem key={s.sport} value={s.sport}>{s.sport}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {defaultSport && (
            <p className="text-xs text-muted-foreground">
              {CATEGORY_LABELS[getCategoryForSport(defaultSport)]} — used for heat risk calculations per SMA 2024.
            </p>
          )}
        </Card>

        {/* Venues */}
        <Card className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-foreground">Venues</h2>
              <p className="text-xs text-muted-foreground mt-1">{venues.length} registered venue{venues.length !== 1 ? 's' : ''}</p>
            </div>
            {isAdmin && (
              <AddVenueDialog onAdd={(v) => addVenue.mutate(v)} isPending={addVenue.isPending} defaultSport={settings?.default_sport} />
            )}
          </div>

          <Collapsible open={venuesOpen} onOpenChange={setVenuesOpen}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="w-full justify-between gap-2 text-xs text-muted-foreground">
                <span className="flex items-center gap-2">
                  <MapPin className="h-3.5 w-3.5" />
                  {venuesOpen ? 'Hide' : 'Show'} venues
                </span>
                <ChevronDown className={`h-3.5 w-3.5 transition-transform ${venuesOpen ? 'rotate-180' : ''}`} />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-2 pt-2">
              {venues.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">No venues added yet</p>
              ) : (
                venues.map(venue => {
                  const official = officials.find(o => o.venue_id === venue.id);
                  return (
                    <div key={venue.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-foreground truncate">{venue.name}</p>
                        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                          <span>{venue.safe_zone_radius} km radius</span>
                          {venue.default_sport && <span>• {venue.default_sport}</span>}
                          {official && <span>• {official.name}</span>}
                        </div>
                      </div>
                      {isAdmin && (
                        <div className="flex items-center gap-1 shrink-0">
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setEditingVenue(venue)}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive">
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete venue?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This will permanently delete "{venue.name}". Games assigned to this venue may be affected.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => deleteVenue.mutate(venue.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </CollapsibleContent>
          </Collapsible>
        </Card>

        {/* Officials */}
        <Card className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-foreground">Officials</h2>
              <p className="text-xs text-muted-foreground mt-1">{officials.length} registered official{officials.length !== 1 ? 's' : ''}</p>
            </div>
            {isAdmin && (
              <AddOfficialDialog venues={venues} onAdd={(o) => addOfficial.mutate(o)} isPending={addOfficial.isPending} />
            )}
          </div>

          <Collapsible open={officialsOpen} onOpenChange={setOfficialsOpen}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="w-full justify-between gap-2 text-xs text-muted-foreground">
                <span className="flex items-center gap-2">
                  <Users className="h-3.5 w-3.5" />
                  {officialsOpen ? 'Hide' : 'Show'} officials
                </span>
                <ChevronDown className={`h-3.5 w-3.5 transition-transform ${officialsOpen ? 'rotate-180' : ''}`} />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-2 pt-2">
              {officials.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">No officials added yet</p>
              ) : (
                officials.map(official => {
                  const venue = venues.find(v => v.id === official.venue_id);
                  return (
                    <div key={official.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-foreground truncate">{official.name}</p>
                        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{official.mobile}</span>
                          {venue && <span>• {venue.name}</span>}
                          <span className="flex items-center gap-1">
                            {official.alerts_enabled ? <Bell className="h-3 w-3" /> : <BellOff className="h-3 w-3" />}
                            {official.alerts_enabled ? 'On' : 'Off'}
                          </span>
                        </div>
                      </div>
                      {isAdmin && (
                        <div className="flex items-center gap-1 shrink-0">
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setEditingOfficial(official)}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive">
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete official?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This will permanently delete "{official.name}".
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => deleteOfficial.mutate(official.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </CollapsibleContent>
          </Collapsible>
        </Card>

        {/* Grades */}
        <Card className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-foreground">Grades</h2>
              <p className="text-xs text-muted-foreground mt-1">{grades.length} grade{grades.length !== 1 ? 's' : ''}</p>
            </div>
            {isAdmin && (
              <Dialog open={addGradeOpen} onOpenChange={(o) => { setAddGradeOpen(o); if (!o) setGradeName(''); }}>
                <DialogTrigger asChild>
                  <Button size="sm" variant="secondary" className="gap-1.5 text-xs">
                    <Plus className="h-3.5 w-3.5" /> Add Grade
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Add Grade</DialogTitle></DialogHeader>
                  <form onSubmit={(e) => { e.preventDefault(); const maxOrder = grades.reduce((m, g) => Math.max(m, g.sort_order), 0); addGrade.mutate({ name: gradeName, sort_order: maxOrder + 1 }, { onSuccess: () => { setAddGradeOpen(false); setGradeName(''); } }); }} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="add-grade-name">Grade Name</Label>
                      <Input id="add-grade-name" value={gradeName} onChange={e => setGradeName(e.target.value)} placeholder="e.g. NRL, NSW Cup, U19s" required />
                    </div>
                    <Button type="submit" className="w-full" disabled={addGrade.isPending}>
                      {addGrade.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Add Grade
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            )}
          </div>

          <Collapsible open={gradesOpen} onOpenChange={setGradesOpen}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="w-full justify-between gap-2 text-xs text-muted-foreground">
                <span className="flex items-center gap-2">
                  <Tags className="h-3.5 w-3.5" />
                  {gradesOpen ? 'Hide' : 'Show'} grades
                </span>
                <ChevronDown className={`h-3.5 w-3.5 transition-transform ${gradesOpen ? 'rotate-180' : ''}`} />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-2 pt-2">
              {grades.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">No grades added yet</p>
              ) : (
                grades.map(grade => (
                  <div key={grade.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 gap-3">
                    <p className="text-sm font-medium text-foreground truncate">{grade.name}</p>
                    {isAdmin && (
                      <div className="flex items-center gap-1 shrink-0">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditingGrade(grade); setGradeName(grade.name); }}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive">
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete grade?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will permanently delete "{grade.name}". Games using it will keep their data.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => deleteGrade.mutate(grade.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    )}
                  </div>
                ))
              )}
            </CollapsibleContent>
          </Collapsible>
        </Card>

        {/* Edit Grade Dialog */}
        <Dialog open={!!editingGrade} onOpenChange={(o) => { if (!o) { setEditingGrade(null); setGradeName(''); } }}>
          <DialogContent>
            <DialogHeader><DialogTitle>Edit Grade</DialogTitle></DialogHeader>
            <form onSubmit={(e) => { e.preventDefault(); if (!editingGrade) return; updateGrade.mutate({ id: editingGrade.id, name: gradeName }, { onSuccess: () => { setEditingGrade(null); setGradeName(''); } }); }} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-grade-name">Grade Name</Label>
                <Input id="edit-grade-name" value={gradeName} onChange={e => setGradeName(e.target.value)} required />
              </div>
              <Button type="submit" className="w-full" disabled={updateGrade.isPending}>
                {updateGrade.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Save Changes
              </Button>
            </form>
          </DialogContent>
        </Dialog>

        {!isAdmin && (
          <p className="text-xs text-muted-foreground text-center">
            You have viewer access. Contact an admin to change settings.
          </p>
        )}
      </main>

      {/* Edit Dialogs */}
      <EditVenueDialog
        venue={editingVenue}
        open={!!editingVenue}
        onOpenChange={(open) => !open && setEditingVenue(null)}
        onSave={(data) => updateVenue.mutate(data, { onSuccess: () => setEditingVenue(null) })}
        isPending={updateVenue.isPending}
      />
      <EditOfficialDialog
        official={editingOfficial}
        venues={venues}
        open={!!editingOfficial}
        onOpenChange={(open) => !open && setEditingOfficial(null)}
        onSave={(data) => updateOfficial.mutate(data, { onSuccess: () => setEditingOfficial(null) })}
        isPending={updateOfficial.isPending}
      />
    </div>
  );
};

export default Settings;
