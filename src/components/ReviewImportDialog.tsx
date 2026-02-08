import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Trash2, Check } from 'lucide-react';
import { Venue, Official } from '@/hooks/useData';
import { ExtractedGame } from './ImportDrawDialog';

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
        start_time: `${g.date}T${g.startTime}:00`,
        end_time: `${g.date}T${g.endTime}:00`,
      }));
    
    onConfirm(validGames as { name: string; venue_id: string; start_time: string; end_time: string }[]);
  };

  const validCount = games.filter(g => g.venueId && g.date && g.startTime && g.endTime).length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Review Imported Games ({games.length})</DialogTitle>
        </DialogHeader>
        
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
                      <Select value={game.venueId} onValueChange={v => updateGame(game.id, 'venueId', v)}>
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue placeholder={game.venue || 'Select venue'} />
                        </SelectTrigger>
                        <SelectContent>
                          {venues.map(v => (
                            <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
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
  );
};
