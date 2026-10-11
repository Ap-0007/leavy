import { Platform } from 'react-native';

import type { CalEvent } from '../types';
import { parseIcs } from './ics';

// Calendar links ("secret iCal address" in Google, "Public Calendar" share link in iCloud).
// Unlike the device calendar, these work in Expo Go, so no development build is needed.

/** Accepts https:// and webcal:// links; returns a fetchable https URL or null. */
export function normalizeFeedUrl(raw: string): string | null {
  let url = raw.trim();
  if (/^webcals?:\/\//i.test(url)) url = url.replace(/^webcals?:\/\//i, 'https://');
  if (!/^https?:\/\//i.test(url)) return null;
  try {
    new URL(url);
  } catch {
    return null;
  }
  return url;
}

export function feedLabel(url: string): string {
  if (/google\.com/i.test(url)) return 'Google Calendar';
  if (/icloud\.com/i.test(url)) return 'iCloud Calendar';
  if (/outlook\.(com|office)/i.test(url)) return 'Outlook Calendar';
  try {
    return new URL(url).host;
  } catch {
    return 'Calendar link';
  }
}

/** Shows enough to recognise a link without displaying the secret part. */
export function maskFeedUrl(url: string): string {
  try {
    const u = new URL(url);
    return `${u.host}/…${u.pathname.slice(-10)}`;
  } catch {
    return '…';
  }
}

// Calendar files can be large; don't re-download on every 5-minute refresh.
const CACHE_MS = 10 * 60_000;
const cache = new Map<string, { at: number; text: string }>();

export async function fetchFeedEvents(url: string, from: Date, to: Date): Promise<CalEvent[]> {
  const hit = cache.get(url);
  let text = hit && Date.now() - hit.at < CACHE_MS ? hit.text : null;

  if (!text) {
    let res: Response;
    try {
      res = await fetch(url);
    } catch {
      throw new Error(
        Platform.OS === 'web'
          ? 'Browsers block calendar links. Open the app on your phone instead.'
          : 'Couldn’t reach this link. Check your connection.',
      );
    }
    if (res.status === 404 || res.status === 403) throw new Error('This link no longer works. It may have been reset; copy it again.');
    if (!res.ok) throw new Error(`Couldn’t load this calendar (error ${res.status}).`);
    text = await res.text();
    if (!text.includes('BEGIN:VCALENDAR')) throw new Error('That link isn’t a calendar link. Copy the iCal address instead.');
    cache.set(url, { at: Date.now(), text });
  }

  return parseIcs(text, from, to, feedLabel(url));
}

export function forgetFeed(url: string) {
  cache.delete(url);
}
