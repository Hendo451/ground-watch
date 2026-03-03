import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { Game, Grade } from '@/hooks/useData';

interface EditGameDialogProps {
  game: Game | null;
  grades: Grade[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (game: { id: string; name?: string; start_time?: string; end_time?: string; warmup_minutes?: number; grade_id?: string | null }) => void;
  isPending?: boolean;
}

export const EditGameDialog = ({ game, grades, open, onOpenChange, onSave, isPending }: EditGameDialogProps) => {
  const [name, setName] = useState('');
  const [gradeId, setGradeId] = useState('__none__');
  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endDate, setEndDate] = useState('');
  const [endTime, setEndTime] = useState('');
  const [warmupMinutes, setWarmupMinutes] = useState(45);

  useEffect(() => {
    if (game) {
      setName(game.name || '');
      setGradeId(game.grade_id || '__none__');
      setWarmupMinutes(game.warmup_minutes ?? 45);
      const start = new Date(game.start_time);
      const end = new Date(game.end_time);
      const pad = (n: number) => n.toString().padStart(2, '0');
      setStartDate(`${start.getFullYear()}-${pad(start.getMonth() + 1)}-${pad(start.getDate())}`);
      setStartTime(`${pad(start.getHours())}:${pad(start.getMinutes())}`);
      setEndDate(`${end.getFullYear()}-${pad(end.getMonth() + 1)}-${pad(end.getDate())}`);
      setEndTime(`${pad(end.getHours())}:${pad(end.getMinutes())}`);
    }
  }, [game]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!game) return;
    
    const start_time = new Date(`${startDate}T${startTime}:00`).toISOString();
    const end_time = new Date(`${endDate}T${endTime}:00`).toISOString();
    onSave({ id: game.id, name: name || undefined, start_time, end_time, warmup_minutes: warmupMinutes, grade_id: gradeId && gradeId !== '__none__' ? gradeId : null });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Game</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-game-name">Game Name</Label>
            <Input id="edit-game-name" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. U15 Semi-Final" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-game-grade">Grade (optional)</Label>
            <Select value={gradeId} onValueChange={setGradeId}>
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
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="edit-start-date">Start Date</Label>
              <Input id="edit-start-date" type="date" value={startDate} onChange={e => setStartDate(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-start-time">Start Time</Label>
              <Input id="edit-start-time" type="time" value={startTime} onChange={e => setStartTime(e.target.value)} required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="edit-end-date">End Date</Label>
              <Input id="edit-end-date" type="date" value={endDate} onChange={e => setEndDate(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-end-time">End Time</Label>
              <Input id="edit-end-time" type="time" value={endTime} onChange={e => setEndTime(e.target.value)} required />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-warmup">Warm-up Period (mins)</Label>
            <Input id="edit-warmup" type="number" min={0} max={120} value={warmupMinutes} onChange={e => setWarmupMinutes(Number(e.target.value))} />
            <p className="text-xs text-muted-foreground">How many minutes before start time to begin monitoring (0–120)</p>
          </div>
          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};
