export type LightningStatus = 'green' | 'orange' | 'red';

export interface Venue {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  safeZoneRadius: number; // km, default 16
}

export interface Official {
  id: string;
  name: string;
  mobile: string;
  venueId: string;
  alertsEnabled: boolean;
}

export interface Game {
  id: string;
  venueId: string;
  startTime: string;
  endTime: string;
  status: LightningStatus;
  countdownEnd: string | null; // ISO string when 30-min timer expires
  lastStrikeDistance: number | null; // km
}
