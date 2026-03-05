import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { Training, Venue, Grade, SportIntensity } from '@/hooks/useData';
import { TimePicker } from './TimePicker';
import { SPORT_CATEGORIES, CATEGORY_LABELS, getCategoryForSport } from '@/lib/sportCategories';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

interface EditTrainingDialogProps {
  training: Training | null;
  venues: Venue[];
  grades: Grade[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: {
    id: string;
    name?: string;
    venue_id?: string | null;
    grade_id?: string | null;
    day_of_week?: number;
    start_time?: string;
    end_time?: string;
    start_date?: string;
    end_date?: string | null;
    sport_intensity?: SportIntensity | null;
  }) => void;
  isPending?: boolean;
}

export const EditTrainingDialog = ({ training, venues, grades, open, onOpenChange, onSave, isPending }: EditTrainingDialogProps) => {
  const [name, setName] = useState('');
  const [venueId, setVenueId] = useState('');
  const [gradeId, setGradeId] = useState('');
  const [dayOfWeek, setDayOfWeek] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [sport, setSport] = useState('');

  useEffect(() => {
    if (training) {
      setName(training.name);
      setVenueId(training.venue_id ?? '__none__');
      setGradeId(training.grade_id ?? '__none__');
      setDayOfWeek(training.day_of_week.toString());
      setStartTime(training.start_time.slice(0, 5));
      setEndTime(training.end_time.slice(0, 5));
      setStartDate(training.start_date);
      setEndDate(training.end_date ?? '');
      setSport('');
    }
  }, [training]);

  const derivedCategory = sport ? getCategoryForSport(sport) : undefined;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!training) return;
    onSave({
      id: training.id,
      name,
      venue_id: venueId && venueId !== '__none__' ? venueId : null,
      grade_id: gradeId && gradeId !== '__none__' ? gradeId : null,
      day_of_week: parseInt(dayOfWeek),
      start_time: startTime,
      end_time: endTime,
      start_date: startDate,
      end_date: endDate || null,
      sport_intensity: derivedCategory ?? null,
    });
  };

  const isValid = name && dayOfWeek && startTime && endTime && startDate;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Training</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-training-name">Training Name</Label>
            <Input
              id="edit-training-name"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. U15s Training"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Grade</Label>
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
              <Label>Venue</Label>
              <Select value={venueId || '__none__'} onValueChange={setVenueId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select venue" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">No venue</SelectItem>
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
              <p className="text-xs text-muted-foreground">{CATEGORY_LABELS[derivedCategory]}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Day of Week</Label>
            <Select value={dayOfWeek} onValueChange={setDayOfWeek}>
              <SelectTrigger>
                <SelectValue placeholder="Select day" />
              </SelectTrigger>
              <SelectContent>
                {DAYS.map((day, i) => (
                  <SelectItem key={i} value={i.toString()}>{day}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Start Time</Label>
              <TimePicker value={startTime} onChange={setStartTime} />
            </div>
            <div className="space-y-2">
              <Label>End Time</Label>
              <TimePicker value={endTime} onChange={setEndTime} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="edit-start-date">Starts From</Label>
              <Input
                id="edit-start-date"
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-end-date">Ends</Label>
              <Input
                id="edit-end-date"
                type="date"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
              />
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={isPending || !isValid}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};
