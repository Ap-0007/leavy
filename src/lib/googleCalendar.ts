import type { CalEvent } from '../types';
import { forgetGoogleToken, googleAccessToken } from './google';

// Google Calendar API v3, read-only. Uses the calendars ticked in Google Calendar's own sidebar.

const API = 'https://www.googleapis.com/calendar/v3';

interface GCalendar {
  id: string;
  summary: string;
  summaryOverride?: string;
  backgroundColor?: string;
  selected?: boolean;
  primary?: boolean;
}

interface GEvent {
  id: string;
  status?: string;
  summary?: string;
  location?: string;
  start: { dateTime?: string; date?: string };
  end: { dateTime?: string; date?: string };
  attendees?: { self?: boolean; responseStatus?: string }[];
}

async function get<T>(path: string, retried = false): Promise<T> {
  const token = await googleAccessToken();
  let res: Response;
  try {
    res = await fetch(`${API}${path}`, { headers: { Authorization: `Bearer ${token}` } });
  } catch {
    throw new Error('Couldn’t reach Google Calendar. Check your connection.');
  }
  if (res.status === 401 && !retried) {
    await forgetGoogleToken(token);
    return get(path, true);
  }
  if (res.status === 401 || res.status === 403) throw new Error('Google Calendar access was removed. Connect it again in Connections.');
  if (!res.ok) throw new Error(`Google Calendar error ${res.status}.`);
  return res.json();
}

export async function fetchGoogleEvents(from: Date, to: Date): Promise<CalEvent[]> {
  const list = await get<{ items: GCalendar[] }>('/users/me/calendarList?minAccessRole=reader');
  const calendars = list.items.filter((c) => c.selected || c.primary);

  const perCalendar = await Promise.all(
    calendars.map(async (cal) => {
      const q = new URLSearchParams({
        timeMin: from.toISOString(),
        timeMax: to.toISOString(),
        singleEvents: 'true',
        orderBy: 'startTime',
        maxResults: '250',
      });
      const { items } = await get<{ items: GEvent[] }>(`/calendars/${encodeURIComponent(cal.id)}/events?${q}`);
      return items
        .filter((e) => e.status !== 'cancelled' && e.start.dateTime && e.end.dateTime)
        .filter((e) => !e.attendees?.some((a) => a.self && a.responseStatus === 'declined'))
        .map((e): CalEvent => {
          const start = new Date(e.start.dateTime!);
          return {
            key: `g:${e.id}@${start.getTime()}`,
            title: e.summary || 'Untitled event',
            start,
            end: new Date(e.end.dateTime!),
            location: e.location?.trim() || null,
            calendarTitle: cal.summaryOverride ?? cal.summary,
            color: cal.backgroundColor,
          };
        });
    }),
  );
  return perCalendar.flat();
}
