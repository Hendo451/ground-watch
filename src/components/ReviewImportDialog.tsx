import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Trash2, Check, Plus, MapPin } from 'lucide-react';
import { Venue, Official, useAddVenue } from '@/hooks/useData';
import { ExtractedGame } from './ImportDrawDialog';
import { LocationSearch } from './LocationSearch';

interface ReviewGame extends ExtractedGame {
  id: string;
  venueId: string;
  officialId: string;
}

interface ReviewImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  extractedGames: ExtractedGame[];
  venues: Venue[];
  officials: Official[];
  onConfirm: (games: { name: string; venue_id: string; start_time: string; end_time: string }[]) => void;
  isPending?: boolean;
}

export const ReviewImportDialog = ({ 
  open, 
  onOpenChange, 
  extractedGames, 
  venues, 
  officials, 
  onConfirm,
  isPending 
}: ReviewImportDialogProps) => {
  const [games, setGames] = useState<ReviewGame[]>([]);
  const [addingVenueForGameId, setAddingVenueForGameId] = useState<string | null>(null);
  const [newVenueName, setNewVenueName] = useState('');
  const [newVenueLat, setNewVenueLat] = useState('');
  const [newVenueLng, setNewVenueLng] = useState('');
  const [newVenueRadius, setNewVenueRadius] = useState('16');
  
  const addVenueMutation = useAddVenue();

  // Auto-match venue names to existing venues
  const findMatchingVenue = (venueName: string): string => {
    if (!venueName || venues.length === 0) return '';
    const lowerName = venueName.toLowerCase();
    // Try exact match first
    const exactMatch = venues.find(v => v.name.toLowerCase() === lowerName);
    if (exactMatch) return exactMatch.id;
    // Try partial match (venue name contains or is contained in extracted name)
    const partialMatch = venues.find(v => 
      lowerName.includes(v.name.toLowerCase()) || 
      v.name.toLowerCase().includes(lowerName.split(',')[0].trim().toLowerCase())
    );
    return partialMatch?.id || '';
  };

  // Reset games when extractedGames changes or dialog opens
  useEffect(() => {
    if (extractedGames.length > 0) {
      setGames(extractedGames.map((g, i) => ({
        ...g,
        id: `temp-${i}`,
        venueId: findMatchingVenue(g.venue),
        officialId: '',
      })));
    }
  }, [extractedGames, venues]);

  // Get unique missing venues from games
  const missingVenues = [...new Set(
    games
      .filter(g => !g.venueId && g.venue)
      .map(g => g.venue)
  )];

  const updateGame = (id: string, field: keyof ReviewGame, value: string) => {
    setGames(prev => prev.map(g => g.id === id ? { ...g, [field]: value } : g));
  };

  const removeGame = (id: string) => {
    setGames(prev => prev.filter(g => g.id !== id));
  };

  const handleConfirm = () => {
    const validGames = games
      .filter(g => g.venueId && g.date && g.startTime && g.endTime)
      .map(g => ({
        name: g.name || undefined,
        venue_id: g.venueId,
        start_time: new Date(`${g.date}T${g.startTime}:00`).toISOString(),
        end_time: new Date(`${g.date}T${g.endTime}:00`).toISOString(),
      }));
    
    onConfirm(validGames as { name: string; venue_id: string; start_time: string; end_time: string }[]);
  };

  const openAddVenueDialog = (gameId: string, suggestedName: string) => {
    setAddingVenueForGameId(gameId);
    setNewVenueName(suggestedName.split(',')[0].trim()); // Use first part as name
    setNewVenueLat('');
    setNewVenueLng('');
    setNewVenueRadius('16');
  };

  const handleLocationSelect = (location: { name: string; latitude: number; longitude: number }) => {
    setNewVenueName(location.name);
    setNewVenueLat(location.latitude.toString());
    setNewVenueLng(location.longitude.toString());
  };

  const handleAddVenue = async () => {
    if (!newVenueName || !newVenueLat || !newVenueLng) return;
    
    addVenueMutation.mutate({
      name: newVenueName,
      latitude: parseFloat(newVenueLat),
      longitude: parseFloat(newVenueLng),
      safe_zone_radius: parseFloat(newVenueRadius),
    }, {
      onSuccess: (newVenue) => {
        // Auto-assign the new venue to games with matching venue text
        const gameBeingAdded = games.find(g => g.id === addingVenueForGameId);
        if (gameBeingAdded && newVenue) {
          setGames(prev => prev.map(g => {
            // Match games with the same venue text
            if (g.venue === gameBeingAdded.venue && !g.venueId) {
              return { ...g, venueId: newVenue.id };
            }
            return g;
          }));
        }
        setAddingVenueForGameId(null);
      }
    });
  };

  const validCount = games.filter(g => g.venueId && g.date && g.startTime && g.endTime).length;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Review Imported Games ({games.length})</DialogTitle>
          </DialogHeader>
          
          {/* Missing Venues Alert */}
          {missingVenues.length > 0 && (
            <div className="bg-warning/20 border-2 border-warning rounded-lg p-4 space-y-3">
              <p className="text-sm font-semibold text-warning flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                {missingVenues.length} venue{missingVenues.length > 1 ? 's' : ''} not found — add them to continue
              </p>
              <div className="flex flex-wrap gap-2">
                {missingVenues.map(venueName => {
                  const gameWithVenue = games.find(g => g.venue === venueName && !g.venueId);
                  return (
                    <Button
                      key={venueName}
                      size="sm"
                      variant="outline"
                      className="gap-1.5 text-xs"
                      onClick={() => gameWithVenue && openAddVenueDialog(gameWithVenue.id, venueName)}
                    >
                      <Plus className="h-3 w-3" />
                      {venueName.length > 30 ? venueName.substring(0, 30) + '...' : venueName}
                    </Button>
                  );
                })}
              </div>
            </div>
          )}
          
          <div className="flex-1 overflow-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-background">
                <tr className="border-b border-border text-muted-foreground text-xs uppercase tracking-wider">
                  <th className="text-left px-2 py-2 font-medium">Game Name</th>
                  <th className="text-left px-2 py-2 font-medium">Venue</th>
                  <th className="text-left px-2 py-2 font-medium">Date</th>
                  <th className="text-left px-2 py-2 font-medium">Start</th>
                  <th className="text-left px-2 py-2 font-medium">End</th>
                  <th className="text-left px-2 py-2 font-medium w-8"></th>
                </tr>
              </thead>
              <tbody>
                {games.map(game => {
                  const isValid = game.venueId && game.date && game.startTime && game.endTime;
                  const needsVenue = !game.venueId && game.venue;
                  return (
                    <tr key={game.id} className={`border-b border-border/50 ${!isValid ? 'bg-warning/5' : ''}`}>
                      <td className="px-2 py-2">
                        <Input 
                          value={game.name} 
                          onChange={e => updateGame(game.id, 'name', e.target.value)}
                          className="h-8 text-xs"
                          placeholder="Game name"
                        />
                      </td>
                      <td className="px-2 py-2">
                        <div className="flex gap-1">
                          <Select value={game.venueId} onValueChange={v => updateGame(game.id, 'venueId', v)}>
                            <SelectTrigger className={`h-8 text-xs flex-1 ${needsVenue ? 'border-warning' : ''}`}>
                              <SelectValue placeholder={game.venue || 'Select venue'} />
                            </SelectTrigger>
                            <SelectContent>
                              {venues.map(v => (
                                <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {needsVenue && (
                            <Button
                              size="icon"
                              variant="outline"
                              className="h-8 w-8 shrink-0"
                              onClick={() => openAddVenueDialog(game.id, game.venue)}
                              title="Add this venue"
                            >
                              <Plus className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </div>
                      </td>
                      <td className="px-2 py-2">
                        <Input 
                          type="date"
                          value={game.date} 
                          onChange={e => updateGame(game.id, 'date', e.target.value)}
                          className="h-8 text-xs"
                        />
                      </td>
                      <td className="px-2 py-2">
                        <Input 
                          type="time"
                          value={game.startTime} 
                          onChange={e => updateGame(game.id, 'startTime', e.target.value)}
                          className="h-8 text-xs w-24"
                        />
                      </td>
                      <td className="px-2 py-2">
                        <Input 
                          type="time"
                          value={game.endTime} 
                          onChange={e => updateGame(game.id, 'endTime', e.target.value)}
                          className="h-8 text-xs w-24"
                        />
                      </td>
                      <td className="px-2 py-2">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-7 w-7 text-destructive hover:text-destructive"
                          onClick={() => removeGame(game.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            
            {games.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No games to import
              </div>
            )}
          </div>

          <DialogFooter className="border-t pt-4">
            <p className="text-xs text-muted-foreground mr-auto">
              {validCount} of {games.length} games ready to import (venue required)
            </p>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleConfirm} disabled={validCount === 0 || isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Check className="mr-2 h-4 w-4" />
              Import {validCount} Games
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Venue Dialog */}
      <Dialog open={addingVenueForGameId !== null} onOpenChange={(open) => !open && setAddingVenueForGameId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Venue</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Search Location</Label>
              <LocationSearch 
                onSelect={handleLocationSelect} 
                placeholder="Search for stadium, park, field..." 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-venue-name">Venue Name</Label>
              <Input 
                id="new-venue-name" 
                value={newVenueName} 
                onChange={e => setNewVenueName(e.target.value)} 
                placeholder="e.g. Belmore Sports Ground" 
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="new-lat">Latitude</Label>
                <Input 
                  id="new-lat" 
                  type="number" 
                  step="any" 
                  value={newVenueLat} 
                  onChange={e => setNewVenueLat(e.target.value)} 
                  placeholder="-33.8885" 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-lng">Longitude</Label>
                <Input 
                  id="new-lng" 
                  type="number" 
                  step="any" 
                  value={newVenueLng} 
                  onChange={e => setNewVenueLng(e.target.value)} 
                  placeholder="151.2231" 
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-radius">Safe Zone Radius (km)</Label>
              <Input 
                id="new-radius" 
                type="number" 
                value={newVenueRadius} 
                onChange={e => setNewVenueRadius(e.target.value)} 
              />
            </div>
            <Button 
              onClick={handleAddVenue} 
              className="w-full" 
              disabled={!newVenueName || !newVenueLat || !newVenueLng || addVenueMutation.isPending}
            >
              {addVenueMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Plus className="mr-2 h-4 w-4" />
              Add Venue
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
