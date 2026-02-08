import { useState } from 'react';
import { format } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Dumbbell, CalendarIcon, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Venue, Grade } from '@/hooks/useData';
import { TimePicker } from './TimePicker';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

interface AddTrainingDialogProps {
  venues: Venue[];
  grades: Grade[];
  onAdd: (training: {
    name: string;
    venue_id?: string;
    grade_id?: string;
    day_of_week: number;
    start_time: string;
    end_time: string;
    start_date: string;
    end_date?: string;
  }) => void;
  isPending?: boolean;
}

export const AddTrainingDialog = ({ venues, grades, onAdd, isPending }: AddTrainingDialogProps) => {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [venueId, setVenueId] = useState('');
  const [gradeId, setGradeId] = useState('');
  const [dayOfWeek, setDayOfWeek] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!startDate) return;
    onAdd({
      name,
      venue_id: venueId && venueId !== '__none__' ? venueId : undefined,
      grade_id: gradeId && gradeId !== '__none__' ? gradeId : undefined,
      day_of_week: parseInt(dayOfWeek),
      start_time: startTime,
      end_time: endTime,
      start_date: format(startDate, 'yyyy-MM-dd'),
      end_date: endDate ? format(endDate, 'yyyy-MM-dd') : undefined,
    });
    setOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setName('');
    setVenueId('');
    setGradeId('');
    setDayOfWeek('');
    setStartTime('');
    setEndTime('');
    setStartDate(undefined);
    setEndDate(undefined);
  };

  const isValid = name && dayOfWeek && startTime && endTime && startDate;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="secondary" className="gap-1.5">
          <Dumbbell className="h-4 w-4" /> Add Training
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Schedule Recurring Training</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="training-name">Training Name</Label>
            <Input 
              id="training-name" 
              value={name} 
              onChange={e => setName(e.target.value)} 
              placeholder="e.g. U15s Training" 
              required 
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="training-grade">Grade (optional)</Label>
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
              <Label htmlFor="training-venue">Venue (optional)</Label>
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
            <Label htmlFor="training-day">Day of Week</Label>
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
              <Label>Starts From</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !startDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, "PP") : "Pick date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={setStartDate}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <Label>Ends</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !endDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, "PP") : "Pick date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={setEndDate}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={isPending || !isValid}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Schedule Training
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};
