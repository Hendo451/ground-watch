import { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { MapPin, Loader2 } from 'lucide-react';

interface NominatimResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
  name?: string;
  address?: {
    amenity?: string;
    stadium?: string;
    leisure?: string;
    building?: string;
    road?: string;
    suburb?: string;
    city?: string;
    state?: string;
    country?: string;
  };
}

interface LocationSearchProps {
  onSelect: (location: { name: string; latitude: number; longitude: number }) => void;
  placeholder?: string;
}

export const LocationSearch = ({ onSelect, placeholder = "Search for a venue..." }: LocationSearchProps) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<NominatimResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (query.length < 3) {
      setResults([]);
      return;
    }

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(async () => {
      setIsLoading(true);
      try {
        // Bias search toward Australia with viewbox (AU bounding box) and prefer sports venues
        const params = new URLSearchParams({
          format: 'json',
          q: query,
          limit: '8', // Fetch more to filter
          addressdetails: '1',
          countrycodes: 'au', // Prioritize Australia
          viewbox: '112.9,-43.7,153.6,-10.7', // Australia bounding box
          bounded: '0', // Don't strictly limit, just prefer
        });
        
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?${params.toString()}`,
          {
            headers: {
              'Accept': 'application/json',
              'User-Agent': 'GameGuard/1.0'
            }
          }
        );
        const data: NominatimResult[] = await response.json();
        
        // Sort to prioritize sports venues (stadiums, ovals, sports centres, parks)
        const sortedData = data.sort((a, b) => {
          const sportsKeywords = ['stadium', 'oval', 'park', 'field', 'ground', 'sports', 'arena', 'reserve', 'recreation'];
          const aIsSports = sportsKeywords.some(k => 
            a.display_name.toLowerCase().includes(k) || 
            a.address?.leisure?.toLowerCase().includes(k) ||
            a.address?.amenity?.toLowerCase().includes(k)
          );
          const bIsSports = sportsKeywords.some(k => 
            b.display_name.toLowerCase().includes(k) ||
            b.address?.leisure?.toLowerCase().includes(k) ||
            b.address?.amenity?.toLowerCase().includes(k)
          );
          if (aIsSports && !bIsSports) return -1;
          if (!aIsSports && bIsSports) return 1;
          return 0;
        });
        
        setResults(sortedData.slice(0, 5)); // Return top 5 after sorting
        setOpen(data.length > 0);
      } catch (error) {
        console.error('Location search failed:', error);
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [query]);

  const handleSelect = (result: NominatimResult) => {
    // Extract a clean venue name
    const venueName = result.address?.amenity 
      || result.address?.stadium 
      || result.address?.leisure 
      || result.address?.building
      || result.name 
      || result.display_name.split(',')[0];

    onSelect({
      name: venueName,
      latitude: parseFloat(result.lat),
      longitude: parseFloat(result.lon)
    });
    
    setQuery(venueName);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div className="relative">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={placeholder}
            className="pl-9"
          />
          {isLoading && (
            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
          )}
        </div>
      </PopoverTrigger>
      <PopoverContent className="p-0 w-[var(--radix-popover-trigger-width)]" align="start">
        <Command>
          <CommandList>
            <CommandEmpty>No locations found.</CommandEmpty>
            <CommandGroup>
              {results.map((result) => (
                <CommandItem
                  key={result.place_id}
                  value={result.display_name}
                  onSelect={() => handleSelect(result)}
                  className="cursor-pointer"
                >
                  <MapPin className="mr-2 h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="truncate">{result.display_name}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};
