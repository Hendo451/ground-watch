import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus } from 'lucide-react';

interface AddVenueDialogProps {
  onAdd: (venue: { name: string; latitude: number; longitude: number; safeZoneRadius: number }) => void;
}

export const AddVenueDialog = ({ onAdd }: AddVenueDialogProps) => {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [lat, setLat] = useState('');
  const [lng, setLng] = useState('');
  const [radius, setRadius] = useState('16');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAdd({ name, latitude: parseFloat(lat), longitude: parseFloat(lng), safeZoneRadius: parseFloat(radius) });
    setOpen(false);
    setName(''); setLat(''); setLng(''); setRadius('16');
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-1.5">
          <Plus className="h-4 w-4" /> Add Venue
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Venue</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="venue-name">Venue Name</Label>
            <Input id="venue-name" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Allianz Stadium" required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="lat">Latitude</Label>
              <Input id="lat" type="number" step="any" value={lat} onChange={e => setLat(e.target.value)} placeholder="-33.8885" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lng">Longitude</Label>
              <Input id="lng" type="number" step="any" value={lng} onChange={e => setLng(e.target.value)} placeholder="151.2231" required />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="radius">Safe Zone Radius (km)</Label>
            <Input id="radius" type="number" value={radius} onChange={e => setRadius(e.target.value)} required />
          </div>
          <Button type="submit" className="w-full">Add Venue</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};
