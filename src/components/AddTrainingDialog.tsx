import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dumbbell, Loader2 } from 'lucide-react';
import { Venue, Grade } from '@/hooks/useData';

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
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAdd({
      name,
      venue_id: venueId && venueId !== '__none__' ? venueId : undefined,
      grade_id: gradeId && gradeId !== '__none__' ? gradeId : undefined,
      day_of_week: parseInt(dayOfWeek),
      start_time: startTime,
      end_time: endTime,
      start_date: startDate,
      end_date: endDate || undefined,
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
    setStartDate('');
    setEndDate('');
  };

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
            <Select value={dayOfWeek} onValueChange={setDayOfWeek} required>
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

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="training-start-time">Start Time</Label>
              <Input 
                id="training-start-time" 
                type="time" 
                value={startTime} 
                onChange={e => setStartTime(e.target.value)} 
                required 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="training-end-time">End Time</Label>
              <Input 
                id="training-end-time" 
                type="time" 
                value={endTime} 
                onChange={e => setEndTime(e.target.value)} 
                required 
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="training-start-date">Starts From</Label>
              <Input 
                id="training-start-date" 
                type="date" 
                value={startDate} 
                onChange={e => setStartDate(e.target.value)} 
                required 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="training-end-date">Ends (optional)</Label>
              <Input 
                id="training-end-date" 
                type="date" 
                value={endDate} 
                onChange={e => setEndDate(e.target.value)} 
              />
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Schedule Training
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};
