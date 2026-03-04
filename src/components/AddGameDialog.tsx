import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { CalendarPlus, CalendarIcon, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Venue, Grade } from '@/hooks/useData';
import { useSettings } from '@/hooks/useSettings';
import { TimePicker } from './TimePicker';
import { SPORT_CATEGORIES, CATEGORY_LABELS, getCategoryForSport } from '@/lib/sportCategories';
import type { SportIntensity } from '@/lib/sportCategories';

interface AddGameDialogProps {
  venues: Venue[];
  grades: Grade[];
  onAdd: (game: { name?: string; venue_id: string; grade_id?: string; start_time: string; end_time: string; warmup_minutes?: number; sport_intensity?: SportIntensity }) => void;
  isPending?: boolean;
}

export const AddGameDialog = ({ venues, grades, onAdd, isPending }: AddGameDialogProps) => {
  const { data: settings } = useSettings();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [venueId, setVenueId] = useState('');
  const [gradeId, setGradeId] = useState('');
  const [date, setDate] = useState<Date>();
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [warmupMinutes, setWarmupMinutes] = useState('45');
  const [sport, setSport] = useState('');

  // Seed sport from global default when settings load
  useEffect(() => {
    if (settings?.default_sport && !sport) {
      setSport(settings.default_sport);
    }
  }, [settings?.default_sport]);

  // When venue changes, auto-set sport to venue's default
  useEffect(() => {
    if (venueId) {
      const venue = venues.find(v => v.id === venueId);
      if (venue?.default_sport) {
        setSport(venue.default_sport);
      }
    }
  }, [venueId, venues]);

  const derivedCategory = sport ? getCategoryForSport(sport) : undefined;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!date) return;
    const dateStr = format(date, 'yyyy-MM-dd');
    const startDate = new Date(`${dateStr}T${startTime}:00`);
    const endDate = new Date(`${dateStr}T${endTime}:00`);
    const start_time = startDate.toISOString();
    const end_time = endDate.toISOString();
    onAdd({ 
      name: name || undefined, 
      venue_id: venueId, 
      grade_id: gradeId && gradeId !== '__none__' ? gradeId : undefined,
      start_time, 
      end_time,
      warmup_minutes: parseInt(warmupMinutes) || 45,
      sport_intensity: derivedCategory,
    });
    setOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setName('');
    setVenueId('');
    setGradeId('');
    setDate(undefined);
    setStartTime('');
    setEndTime('');
    setWarmupMinutes('45');
    setSport(settings?.default_sport ?? '');
  };

  const isValid = venueId && date && startTime && endTime;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="secondary" className="gap-1.5">
          <CalendarPlus className="h-4 w-4" /> Schedule Game
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Schedule Game</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="game-name">Game Name</Label>
            <Input id="game-name" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. U15 Semi-Final" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="game-grade">Grade</Label>
              <Select value={gradeId || '__none__'} onValueChange={setGradeId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select grade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">No grade</SelectItem>
                  {grades.map(g => (
                    <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="game-venue">Venue</Label>
              <Select value={venueId} onValueChange={setVenueId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select venue" />
                </SelectTrigger>
                <SelectContent>
                  {venues.map(v => (
                    <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Sport</Label>
            <Select value={sport} onValueChange={setSport}>
              <SelectTrigger>
                <SelectValue placeholder="Select sport" />
              </SelectTrigger>
              <SelectContent>
                {SPORT_CATEGORIES.map(s => (
                  <SelectItem key={s.sport} value={s.sport}>{s.sport}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {derivedCategory && (
              <p className="text-xs text-muted-foreground">
                {CATEGORY_LABELS[derivedCategory]}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  initialFocus
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-2">
              <Label>Start Time</Label>
              <TimePicker value={startTime} onChange={setStartTime} />
            </div>
            <div className="space-y-2">
              <Label>End Time</Label>
              <TimePicker value={endTime} onChange={setEndTime} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="warmup">Warm-up (mins)</Label>
              <Input 
                id="warmup" 
                type="number" 
                min="0" 
                max="120"
                value={warmupMinutes} 
                onChange={e => setWarmupMinutes(e.target.value)} 
                placeholder="45"
              />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Lightning monitoring starts {warmupMinutes || 45} minutes before the game begins.
          </p>

          <Button type="submit" className="w-full" disabled={isPending || !isValid}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Schedule Game
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};
