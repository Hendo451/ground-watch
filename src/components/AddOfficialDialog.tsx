import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UserPlus, Loader2 } from 'lucide-react';
import { Venue } from '@/hooks/useData';

interface AddOfficialDialogProps {
  venues: Venue[];
  onAdd: (official: { name: string; mobile: string; venue_id: string | null }) => void;
  isPending?: boolean;
}

export const AddOfficialDialog = ({ venues, onAdd, isPending }: AddOfficialDialogProps) => {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [venueId, setVenueId] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAdd({ name, mobile, venue_id: venueId || null });
    setOpen(false);
    setName(''); setMobile(''); setVenueId('');
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="secondary" className="gap-1.5">
          <UserPlus className="h-4 w-4" /> Add Official
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Official</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="off-name">Full Name</Label>
            <Input id="off-name" value={name} onChange={e => setName(e.target.value)} placeholder="James Wilson" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="off-mobile">Mobile Number</Label>
            <Input id="off-mobile" value={mobile} onChange={e => setMobile(e.target.value)} placeholder="+61400111222" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="off-venue">Assigned Venue</Label>
            <Select value={venueId} onValueChange={setVenueId}>
              <SelectTrigger>
                <SelectValue placeholder="Select venue (optional)" />
              </SelectTrigger>
              <SelectContent>
                {venues.map(v => (
                  <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Add Official
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};
