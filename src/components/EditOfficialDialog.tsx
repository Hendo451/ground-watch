import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Loader2 } from 'lucide-react';
import { Official, Venue } from '@/hooks/useData';
import { PhoneInput } from './PhoneInput';

interface EditOfficialDialogProps {
  official: Official | null;
  venues: Venue[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: { id: string; name?: string; mobile?: string; venue_id?: string | null; alerts_enabled?: boolean }) => void;
  isPending?: boolean;
}

export const EditOfficialDialog = ({ official, venues, open, onOpenChange, onSave, isPending }: EditOfficialDialogProps) => {
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [venueId, setVenueId] = useState('');
  const [alertsEnabled, setAlertsEnabled] = useState(true);

  useEffect(() => {
    if (official) {
      setName(official.name);
      setMobile(official.mobile);
      setVenueId(official.venue_id || '');
      setAlertsEnabled(official.alerts_enabled);
    }
  }, [official]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!official) return;
    onSave({
      id: official.id,
      name,
      mobile,
      venue_id: venueId || null,
      alerts_enabled: alertsEnabled,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Official</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-off-name">Full Name</Label>
            <Input id="edit-off-name" value={name} onChange={e => setName(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-off-mobile">Mobile Number</Label>
            <PhoneInput id="edit-off-mobile" value={mobile} onChange={setMobile} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-off-venue">Assigned Venue</Label>
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
          <div className="flex items-center justify-between">
            <Label className="text-xs">SMS Alerts</Label>
            <Switch checked={alertsEnabled} onCheckedChange={setAlertsEnabled} />
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
