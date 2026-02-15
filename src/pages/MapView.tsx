import { useVenues, useGames } from '@/hooks/useData';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, MapPin, Loader2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useState, useEffect, useMemo } from 'react';
import WeatherMap from '@/components/WeatherMap';

// Publishable Xweather client keys for MapsGL (client-side SDK)
// These are safe to include in client code — they are publishable keys
const XWEATHER_CLIENT_ID = 'YOUR_XWEATHER_CLIENT_ID';
const XWEATHER_CLIENT_SECRET = 'YOUR_XWEATHER_CLIENT_SECRET';

const MapViewPage = () => {
  const { data: venues = [], isLoading: venuesLoading } = useVenues();
  const { data: games = [], isLoading: gamesLoading } = useGames();
  const [selectedVenueId, setSelectedVenueId] = useState<string>('');

  const isLoading = venuesLoading || gamesLoading;

  useEffect(() => {
    if (venues.length > 0 && !selectedVenueId) {
      setSelectedVenueId(venues[0].id);
    }
  }, [venues, selectedVenueId]);

  const selectedVenue = venues.find(v => v.id === selectedVenueId);

  // Find active game at this venue to get strike data
  const activeGame = useMemo(() => {
    if (!selectedVenueId) return null;
    const now = new Date();
    return games.find(g => {
      if (g.venue_id !== selectedVenueId) return false;
      const start = new Date(g.start_time);
      const end = new Date(g.end_time);
      return now >= start && now <= end;
    }) || null;
  }, [games, selectedVenueId]);

  const missingCredentials = !XWEATHER_CLIENT_ID || !XWEATHER_CLIENT_SECRET;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-20">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link to="/">
              <Button variant="ghost" size="sm" className="gap-1.5">
                <ArrowLeft className="h-4 w-4" /> Dashboard
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary" />
              <h1 className="text-sm font-bold text-foreground">Lightning Map</h1>
            </div>
          </div>

          {venues.length > 1 && (
            <Select value={selectedVenueId} onValueChange={setSelectedVenueId}>
              <SelectTrigger className="w-48 h-9">
                <SelectValue placeholder="Select venue" />
              </SelectTrigger>
              <SelectContent>
                {venues.map(v => (
                  <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </header>

      <main className="flex-1 relative">
        {missingCredentials ? (
          <div className="flex items-center justify-center h-full min-h-[400px] px-6">
            <div className="text-center space-y-3 max-w-md">
              <MapPin className="h-12 w-12 text-muted-foreground mx-auto" />
              <h2 className="text-lg font-semibold text-foreground">Map Credentials Required</h2>
              <p className="text-sm text-muted-foreground">
                Set <code className="bg-muted px-1.5 py-0.5 rounded text-xs">VITE_XWEATHER_MAP_CLIENT_ID</code> and{' '}
                <code className="bg-muted px-1.5 py-0.5 rounded text-xs">VITE_XWEATHER_MAP_CLIENT_SECRET</code> environment
                variables to enable the live lightning map.
              </p>
            </div>
          </div>
        ) : selectedVenue ? (
          <WeatherMap
            clientId={XWEATHER_CLIENT_ID}
            clientSecret={XWEATHER_CLIENT_SECRET}
            latitude={selectedVenue.latitude}
            longitude={selectedVenue.longitude}
            safetyRadiusKm={selectedVenue.safe_zone_radius}
            groundLabel={selectedVenue.name}
            lastStrikeDistanceKm={activeGame?.last_strike_distance}
            lastStrikeAt={activeGame?.last_strike_at}
            lastStrikeLat={(activeGame as any)?.last_strike_lat}
            lastStrikeLng={(activeGame as any)?.last_strike_lng}
          />
        ) : (
          <div className="flex items-center justify-center h-full min-h-[400px]">
            <p className="text-muted-foreground">No venues configured</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default MapViewPage;
