import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useSettings, useUpdateSettings } from '@/hooks/useSettings';
import { useVenues, useOfficials } from '@/hooks/useData';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Loader2, Save, MapPin, Users } from 'lucide-react';
import { Link, Navigate } from 'react-router-dom';
import { toast } from 'sonner';
import { SPORT_CATEGORIES, CATEGORY_LABELS, getCategoryForSport } from '@/lib/sportCategories';

const Settings = () => {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const { data: settings, isLoading: settingsLoading } = useSettings();
  const { data: venues = [] } = useVenues();
  const { data: officials = [] } = useOfficials();
  const updateSettings = useUpdateSettings();

  const [warmup, setWarmup] = useState(45);
  const [upcomingDays, setUpcomingDays] = useState(7);
  const [countdownMins, setCountdownMins] = useState(30);
  const [smsEnabled, setSmsEnabled] = useState(true);
  const [defaultSport, setDefaultSport] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);

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

        {/* Quick Links */}
        <Card className="p-6 space-y-4">
          <div>
            <h2 className="text-sm font-semibold text-foreground">Venues & Officials</h2>
            <p className="text-xs text-muted-foreground mt-1">Quick overview of registered venues and officials.</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
              <MapPin className="h-4 w-4 text-primary" />
              <div>
                <p className="text-lg font-semibold text-foreground">{venues.length}</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Venues</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
              <Users className="h-4 w-4 text-primary" />
              <div>
                <p className="text-lg font-semibold text-foreground">{officials.length}</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Officials</p>
              </div>
            </div>
          </div>
        </Card>

        {!isAdmin && (
          <p className="text-xs text-muted-foreground text-center">
            You have viewer access. Contact an admin to change settings.
          </p>
        )}
      </main>
    </div>
  );
};

export default Settings;
