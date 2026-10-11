import * as Location from 'expo-location';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { AppState, Platform } from 'react-native';

import type { CalEvent, Trip } from '../types';
import { fetchEvents, requestCalendarAccess, type CalendarAccess } from './calendar';
import { demoEvents, demoRoute } from './demo';
import { ensureNotificationPermission, syncLeaveAlerts } from './notifications';
import { getRoute, hasApiKey, type LatLng } from './routes';
import { useSettings } from './settings';

export type LocationAccess = 'granted' | 'denied' | 'unknown';

interface TripsState {
  loading: boolean;
  refreshing: boolean;
  calendarAccess: CalendarAccess | null;
  locationAccess: LocationAccess;
  usingDemo: boolean;
  trips: Trip[];
  /** Events in range that have no location, so no travel time can be worked out. */
  noLocation: CalEvent[];
  updatedAt: Date | null;
}

interface TripsContextValue extends TripsState {
  refresh: () => Promise<void>;
}

const AUTO_REFRESH_MS = 5 * 60_000;

const TripsContext = createContext<TripsContextValue | null>(null);

async function currentPosition(): Promise<{ access: LocationAccess; origin: LatLng | null }> {
  const perm = await Location.requestForegroundPermissionsAsync();
  if (!perm.granted) return { access: 'denied', origin: null };
  const pos =
    (await Location.getLastKnownPositionAsync({ maxAge: 2 * 60_000, requiredAccuracy: 200 })) ??
    (await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }));
  return { access: 'granted', origin: { latitude: pos.coords.latitude, longitude: pos.coords.longitude } };
}

export function TripsProvider({ children }: { children: ReactNode }) {
  const { settings, ready } = useSettings();
  const [state, setState] = useState<TripsState>({
    loading: true,
    refreshing: false,
    calendarAccess: null,
    locationAccess: 'unknown',
    usingDemo: false,
    trips: [],
    noLocation: [],
    updatedAt: null,
  });
  // Ignore results from a refresh that a newer one has overtaken.
  const runId = useRef(0);

  const refresh = useCallback(async () => {
    const id = ++runId.current;
    setState((s) => ({ ...s, refreshing: true }));

    const now = Date.now();
    const calendarAccess = await requestCalendarAccess();
    const usingDemo = settings.demoMode || calendarAccess === 'unavailable';

    let events: CalEvent[] = [];
    let locationAccess: LocationAccess = 'unknown';
    let origin: LatLng | null = null;

    try {
      if (usingDemo) {
        events = demoEvents(now);
      } else if (calendarAccess === 'granted') {
        const to = new Date(now + settings.lookAheadHours * 3_600_000);
        events = await fetchEvents(settings.calendarIds, new Date(now), to);
        ({ access: locationAccess, origin } = await currentPosition());
      }
    } catch (e) {
      console.warn('Refresh failed', e);
    }

    const horizon = now + settings.lookAheadHours * 3_600_000;
    const upcoming = events
      .filter((e) => e.start.getTime() > now && e.start.getTime() <= horizon)
      .sort((a, b) => a.start.getTime() - b.start.getTime());

    const trips: Trip[] = await Promise.all(
      upcoming
        .filter((e) => e.location)
        .map(async (event): Promise<Trip> => {
          const mode = settings.modeOverrides[event.key] ?? settings.defaultMode;
          const graceMin = settings.graceOverrides[event.key] ?? settings.graceMin;
          const arriveBy = new Date(event.start.getTime() - graceMin * 60_000);
          const notify = settings.notifyOverrides[event.key] ?? settings.notifications;
          const trip: Trip = { event, mode, graceMin, arriveBy, notify };

          if (usingDemo) return { ...trip, route: demoRoute(event.key, mode, arriveBy) };
          if (!hasApiKey) return { ...trip, error: 'Add a Google Maps API key to get travel times.' };
          if (!origin) return { ...trip, error: 'Turn on location to get travel times.' };
          try {
            return { ...trip, route: await getRoute(origin, event.location!, mode, arriveBy) };
          } catch (e) {
            return { ...trip, error: e instanceof Error ? e.message : 'Could not get a route.' };
          }
        }),
    );
    // Soonest departure first; trips without an estimate fall back to their start time.
    trips.sort((a, b) => (a.route?.leaveBy ?? a.event.start).getTime() - (b.route?.leaveBy ?? b.event.start).getTime());

    if (id !== runId.current) return;
    setState({
      loading: false,
      refreshing: false,
      calendarAccess,
      locationAccess,
      usingDemo,
      trips,
      noLocation: upcoming.filter((e) => !e.location),
      updatedAt: new Date(),
    });

    if (Platform.OS !== 'web') {
      const wanted = trips.filter((t) => t.notify);
      const allowed = wanted.length > 0 && (await ensureNotificationPermission());
      await syncLeaveAlerts(allowed ? wanted : [], settings.headsUpMin).catch((e) => console.warn('Alert sync failed', e));
    }
  }, [settings]);

  // Recompute whenever settings change (grace period, mode, calendars…).
  useEffect(() => {
    if (ready) refresh();
  }, [ready, refresh]);

  // Keep data fresh while the app is open and whenever it comes back to the foreground.
  useEffect(() => {
    if (!ready) return;
    const timer = setInterval(refresh, AUTO_REFRESH_MS);
    const sub = AppState.addEventListener('change', (s) => s === 'active' && refresh());
    return () => {
      clearInterval(timer);
      sub.remove();
    };
  }, [ready, refresh]);

  const value = useMemo(() => ({ ...state, refresh }), [state, refresh]);
  return <TripsContext.Provider value={value}>{children}</TripsContext.Provider>;
}

export function useTrips(): TripsContextValue {
  const ctx = useContext(TripsContext);
  if (!ctx) throw new Error('useTrips must be used inside TripsProvider');
  return ctx;
}
