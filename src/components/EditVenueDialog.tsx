import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { LocationSearch } from './LocationSearch';
import { SPORT_CATEGORIES, CATEGORY_LABELS, getCategoryForSport, type SportIntensity } from '@/lib/sportCategories';
import { Venue } from '@/hooks/useData';

interface EditVenueDialogProps {
  venue: Venue | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: { id: string; name?: string; latitude?: number; longitude?: number; safe_zone_radius?: number; sport_intensity?: SportIntensity; default_sport?: string }) => void;
  isPending?: boolean;
}

export const EditVenueDialog = ({ venue, open, onOpenChange, onSave, isPending }: EditVenueDialogProps) => {
  const [name, setName] = useState('');
  const [lat, setLat] = useState('');
  const [lng, setLng] = useState('');
  const [radius, setRadius] = useState('');
  const [selectedSport, setSelectedSport] = useState('AFL');

  useEffect(() => {
    if (venue) {
      setName(venue.name);
      setLat(venue.latitude.toString());
      setLng(venue.longitude.toString());
      setRadius(venue.safe_zone_radius.toString());
      setSelectedSport(venue.default_sport || 'AFL');
    }
  }, [venue]);

  const derivedCategory = getCategoryForSport(selectedSport);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!venue) return;
    onSave({
      id: venue.id,
      name,
      latitude: parseFloat(lat),
      longitude: parseFloat(lng),
      safe_zone_radius: parseFloat(radius),
      sport_intensity: derivedCategory,
      default_sport: selectedSport,
    });
  };

  const handleLocationSelect = (location: { name: string; latitude: number; longitude: number }) => {
    setName(location.name);
    setLat(location.latitude.toString());
    setLng(location.longitude.toString());
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Venue</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Search Location</Label>
            <LocationSearch onSelect={handleLocationSelect} placeholder="Search for stadium, park, field..." />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-venue-name">Venue Name</Label>
            <Input id="edit-venue-name" value={name} onChange={e => setName(e.target.value)} required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="edit-lat">Latitude</Label>
              <Input id="edit-lat" type="number" step="any" value={lat} onChange={e => setLat(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-lng">Longitude</Label>
              <Input id="edit-lng" type="number" step="any" value={lng} onChange={e => setLng(e.target.value)} required />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-radius">Safe Zone Radius (km)</Label>
            <Input id="edit-radius" type="number" value={radius} onChange={e => setRadius(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label>Default Sport</Label>
            <Select value={selectedSport} onValueChange={setSelectedSport}>
              <SelectTrigger>
                <SelectValue placeholder="Select sport" />
              </SelectTrigger>
              <SelectContent>
                {SPORT_CATEGORIES.map(s => (
                  <SelectItem key={s.sport} value={s.sport}>{s.sport}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {CATEGORY_LABELS[derivedCategory]} — used for heat risk calculations per SMA 2024.
            </p>
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
