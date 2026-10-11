import type { RouteInfo, TravelMode } from '../types';

// Google Routes API (computeRoutes). Key comes from .env.local — see README.
const API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ?? '';
const ENDPOINT = 'https://routes.googleapis.com/directions/v2:computeRoutes';
const FIELD_MASK = [
  'routes.duration',
  'routes.distanceMeters',
  'routes.legs.steps.travelMode',
  'routes.legs.steps.staticDuration',
  'routes.legs.steps.transitDetails.stopDetails.departureTime',
  'routes.legs.steps.transitDetails.transitLine.nameShort',
  'routes.legs.steps.transitDetails.transitLine.name',
].join(',');

export const hasApiKey = API_KEY.length > 0;

const API_MODE: Record<TravelMode, string> = {
  drive: 'DRIVE',
  transit: 'TRANSIT',
  walk: 'WALK',
  bike: 'BICYCLE',
};

export interface LatLng {
  latitude: number;
  longitude: number;
}

interface ApiStep {
  travelMode?: string;
  staticDuration?: string;
  transitDetails?: {
    stopDetails?: { departureTime?: string };
    transitLine?: { nameShort?: string; name?: string };
  };
}

interface ApiRoute {
  duration?: string;
  distanceMeters?: number;
  legs?: { steps?: ApiStep[] }[];
}

/** Durations come back as strings like "1650s". */
const seconds = (d?: string) => (d ? parseFloat(d) : 0);

async function computeRoute(body: object): Promise<ApiRoute> {
  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': API_KEY,
      'X-Goog-FieldMask': FIELD_MASK,
    },
    body: JSON.stringify(body),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json?.error?.message ?? `Routes API error (${res.status})`);
  const route: ApiRoute | undefined = json.routes?.[0];
  if (!route) throw new Error('No route found to this location.');
  return route;
}

// Traffic changes slowly; reuse results for a few minutes to keep API usage low.
const CACHE_MS = 5 * 60_000;
const cache = new Map<string, { at: number; info: RouteInfo }>();

export async function getRoute(origin: LatLng, destination: string, mode: TravelMode, arriveBy: Date): Promise<RouteInfo> {
  const key = [origin.latitude.toFixed(3), origin.longitude.toFixed(3), destination, mode, arriveBy.getTime()].join('|');
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < CACHE_MS) return hit.info;

  const base = {
    origin: { location: { latLng: origin } },
    destination: { address: destination },
    travelMode: API_MODE[mode],
  };

  let info: RouteInfo;
  if (mode === 'drive') info = await driveRoute(base, arriveBy);
  else if (mode === 'transit') info = await transitRoute(base, arriveBy);
  else {
    const route = await computeRoute(base);
    const durationSec = seconds(route.duration);
    info = { durationSec, distanceMeters: route.distanceMeters, leaveBy: new Date(arriveBy.getTime() - durationSec * 1000) };
  }

  cache.set(key, { at: Date.now(), info });
  return info;
}

/**
 * Traffic depends on *when* you drive, so ask twice: first for "now" to estimate the
 * departure time, then again for that departure time if it's far enough away to matter.
 */
async function driveRoute(base: object, arriveBy: Date): Promise<RouteInfo> {
  let route = await computeRoute({ ...base, routingPreference: 'TRAFFIC_AWARE' });
  let durationSec = seconds(route.duration);

  const departGuess = arriveBy.getTime() - durationSec * 1000;
  if (departGuess - Date.now() > 10 * 60_000) {
    route = await computeRoute({
      ...base,
      routingPreference: 'TRAFFIC_AWARE',
      departureTime: new Date(departGuess).toISOString(),
    });
    durationSec = seconds(route.duration);
  }

  return { durationSec, distanceMeters: route.distanceMeters, leaveBy: new Date(arriveBy.getTime() - durationSec * 1000) };
}

/**
 * Transit runs on a schedule, so "arrive by" picks the actual bus/train. You need to
 * leave in time to walk to its first departure, which may be earlier than arriveBy - duration.
 */
async function transitRoute(base: object, arriveBy: Date): Promise<RouteInfo> {
  const route = await computeRoute({ ...base, arrivalTime: arriveBy.toISOString() });
  const durationSec = seconds(route.duration);
  const steps = route.legs?.flatMap((l) => l.steps ?? []) ?? [];

  let leaveBy = new Date(arriveBy.getTime() - durationSec * 1000);
  const firstRide = steps.findIndex((s) => s.travelMode === 'TRANSIT');
  const departure = steps[firstRide]?.transitDetails?.stopDetails?.departureTime;
  if (departure) {
    const walkToStopSec = steps.slice(0, firstRide).reduce((sum, s) => sum + seconds(s.staticDuration), 0);
    leaveBy = new Date(Date.parse(departure) - walkToStopSec * 1000);
  }

  const lines = steps
    .filter((s) => s.travelMode === 'TRANSIT')
    .map((s) => s.transitDetails?.transitLine?.nameShort ?? s.transitDetails?.transitLine?.name)
    .filter(Boolean);

  return {
    durationSec,
    distanceMeters: route.distanceMeters,
    leaveBy,
    transitSummary: lines.length ? lines.join(' → ') : undefined,
  };
}
