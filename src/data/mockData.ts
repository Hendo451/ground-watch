import { Venue, Official, Game } from '@/types/lightning';

export const mockVenues: Venue[] = [
  { id: '1', name: 'Allianz Stadium', latitude: -33.8885, longitude: 151.2231, safeZoneRadius: 16 },
  { id: '2', name: 'Accor Stadium', latitude: -33.8468, longitude: 151.0635, safeZoneRadius: 16 },
  { id: '3', name: 'SCG', latitude: -33.8917, longitude: 151.2247, safeZoneRadius: 16 },
];

export const mockOfficials: Official[] = [
  { id: '1', name: 'James Wilson', mobile: '+61400111222', venueId: '1', alertsEnabled: true },
  { id: '2', name: 'Sarah Chen', mobile: '+61400333444', venueId: '2', alertsEnabled: true },
  { id: '3', name: 'Mark Thompson', mobile: '+61400555666', venueId: '3', alertsEnabled: true },
];

export const mockGames: Game[] = [
  { id: '1', venueId: '1', startTime: '2026-02-08T14:00:00', endTime: '2026-02-08T16:00:00', status: 'red', countdownEnd: '2026-02-08T15:30:00', lastStrikeDistance: 8.2 },
  { id: '2', venueId: '2', startTime: '2026-02-08T15:00:00', endTime: '2026-02-08T17:00:00', status: 'orange', countdownEnd: null, lastStrikeDistance: 22.5 },
  { id: '3', venueId: '3', startTime: '2026-02-08T18:00:00', endTime: '2026-02-08T20:00:00', status: 'green', countdownEnd: null, lastStrikeDistance: null },
];
