import type { CalEvent, RouteInfo, TravelMode } from '../types';

// Sample data so the app is fully usable in Expo Go / web, or before an API key is set up.

const SAMPLES: { title: string; inMin: number; lengthMin: number; location: string | null; driveMin: number }[] = [
  { title: 'Coffee with Maya', inMin: 32, lengthMin: 45, location: 'Balzac’s Coffee, 1 Trinity St', driveMin: 14 },
  { title: 'Dentist appointment', inMin: 150, lengthMin: 30, location: 'Smile Dental, 120 King St W', driveMin: 22 },
  { title: 'Study group', inMin: 240, lengthMin: 90, location: 'Central Library, 789 Yonge St', driveMin: 18 },
  { title: 'Team standup (video call)', inMin: 300, lengthMin: 15, location: null, driveMin: 0 },
  { title: 'Soccer practice', inMin: 420, lengthMin: 90, location: 'Riverdale Park East, Field 3', driveMin: 11 },
];

const MODE_FACTOR: Record<TravelMode, number> = { drive: 1, transit: 1.7, walk: 4.2, bike: 1.9 };

export function demoEvents(now: number): CalEvent[] {
  // Snap to the minute so countdowns tick cleanly.
  const base = Math.floor(now / 60_000) * 60_000;
  return SAMPLES.map((s, i) => {
    const start = new Date(base + s.inMin * 60_000);
    return {
      key: `demo-${i}`,
      title: s.title,
      start,
      end: new Date(start.getTime() + s.lengthMin * 60_000),
      location: s.location,
      calendarTitle: 'Demo',
    };
  });
}

export function demoRoute(eventKey: string, mode: TravelMode, arriveBy: Date): RouteInfo {
  const sample = SAMPLES[Number(eventKey.replace('demo-', ''))] ?? SAMPLES[0];
  const durationSec = Math.round(sample.driveMin * MODE_FACTOR[mode]) * 60;
  return {
    durationSec,
    distanceMeters: sample.driveMin * 650,
    leaveBy: new Date(arriveBy.getTime() - durationSec * 1000),
    transitSummary: mode === 'transit' ? '504 King → Line 1' : undefined,
  };
}
