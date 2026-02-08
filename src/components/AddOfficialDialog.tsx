import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UserPlus } from 'lucide-react';
import { Venue } from '@/types/lightning';

interface AddOfficialDialogProps {
  venues: Venue[];
  onAdd: (official: { name: string; mobile: string; venueId: string }) => void;
}

export const AddOfficialDialog = ({ venues, onAdd }: AddOfficialDialogProps) => {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [venueId, setVenueId] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAdd({ name, mobile, venueId });
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
            <Select value={venueId} onValueChange={setVenueId} required>
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
          <Button type="submit" className="w-full">Add Official</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};
