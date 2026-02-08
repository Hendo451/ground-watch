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

const COUNTRIES = [
  { code: 'AU', name: 'Australia', dial: '+61' },
  { code: 'NZ', name: 'New Zealand', dial: '+64' },
  { code: 'US', name: 'United States', dial: '+1' },
  { code: 'GB', name: 'United Kingdom', dial: '+44' },
  { code: 'IE', name: 'Ireland', dial: '+353' },
] as const;

export const AddOfficialDialog = ({ venues, onAdd, isPending }: AddOfficialDialogProps) => {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [country, setCountry] = useState('AU');
  const [mobileNational, setMobileNational] = useState('');
  const [venueId, setVenueId] = useState('');

  const selectedCountry = COUNTRIES.find(c => c.code === country) ?? COUNTRIES[0];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    let national = mobileNational.replace(/[^\d]/g, '');
    // Common AU entry pattern: people type 04xx... locally; E.164 should be +614xx...
    if (country === 'AU' && national.startsWith('0')) national = national.slice(1);

    const mobile = `${selectedCountry.dial}${national}`;

    onAdd({ name, mobile, venue_id: venueId || null });
    setOpen(false);
    setName(''); setCountry('AU'); setMobileNational(''); setVenueId('');
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
            <div className="flex gap-2">
              <Select value={country} onValueChange={setCountry}>
                <SelectTrigger className="w-[190px]">
                  <SelectValue placeholder="Country" />
                </SelectTrigger>
                <SelectContent>
                  {COUNTRIES.map(c => (
                    <SelectItem key={c.code} value={c.code}>
                      {c.name} ({c.dial})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                id="off-mobile"
                value={mobileNational}
                onChange={e => setMobileNational(e.target.value)}
                placeholder="e.g. 400 111 222"
                inputMode="tel"
                required
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Saved as {selectedCountry.dial}{mobileNational.replace(/[^\d]/g, '') || '…'}
            </p>
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
