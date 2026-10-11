import * as Calendar from 'expo-calendar';
import { Platform } from 'react-native';

import type { CalEvent } from '../types';

/** 'unavailable' = this runtime can't read calendars (web, Expo Go). The app falls back to demo data. */
export type CalendarAccess = 'granted' | 'denied' | 'unavailable';

export interface CalendarSummary {
  id: string;
  title: string;
  color?: string;
  account?: string;
}

export async function requestCalendarAccess(): Promise<CalendarAccess> {
  if (Platform.OS === 'web') return 'unavailable';
  try {
    const res = await Calendar.requestCalendarPermissions();
    return res.granted ? 'granted' : 'denied';
  } catch {
    return 'unavailable';
  }
}

/**
 * Lists every event calendar on the device. Google accounts added in the phone's
 * settings show up here alongside iCloud/Apple calendars, so both are covered.
 */
export async function listCalendars(): Promise<CalendarSummary[]> {
  const cals = await Calendar.getCalendars(Calendar.EntityTypes.EVENT);
  return cals.map((c) => ({ id: c.id, title: c.title, color: c.color, account: c.source?.name }));
}

export async function fetchEvents(calendarIds: string[] | null, from: Date, to: Date): Promise<CalEvent[]> {
  const all = await listCalendars();
  const byId = new Map(all.map((c) => [c.id, c]));
  const ids = calendarIds ? calendarIds.filter((id) => byId.has(id)) : all.map((c) => c.id);
  if (ids.length === 0) return [];

  const events = await Calendar.listEvents(ids, from, to);
  return events
    .filter((e) => !e.allDay)
    .map((e) => {
      const start = new Date(e.startDate);
      const cal = byId.get(e.calendarId);
      return {
        key: `${e.id}@${start.getTime()}`,
        title: e.title || 'Untitled event',
        start,
        end: new Date(e.endDate),
        location: e.location?.trim() || null,
        calendarTitle: cal?.title,
        color: cal?.color,
      };
    });
}
