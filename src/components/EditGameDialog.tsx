import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { Game } from '@/hooks/useData';

interface EditGameDialogProps {
  game: Game | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (game: { id: string; name?: string; start_time?: string; end_time?: string }) => void;
  isPending?: boolean;
}

export const EditGameDialog = ({ game, open, onOpenChange, onSave, isPending }: EditGameDialogProps) => {
  const [name, setName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endDate, setEndDate] = useState('');
  const [endTime, setEndTime] = useState('');

  useEffect(() => {
    if (game) {
      setName(game.name || '');
      const start = new Date(game.start_time);
      const end = new Date(game.end_time);
      // Use local date/time strings for display
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
    onSave({ id: game.id, name: name || undefined, start_time, end_time });
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
          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};
