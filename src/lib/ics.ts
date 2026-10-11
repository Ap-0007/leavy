import ICAL from 'ical.js';

import type { CalEvent } from '../types';

type IcalEvent = InstanceType<typeof ICAL.Event>;
type IcalTime = InstanceType<typeof ICAL.Time>;

/** Expands an iCalendar file into the timed events that start between `from` and `to`. */
export function parseIcs(text: string, from: Date, to: Date, source: string): CalEvent[] {
  const root = new ICAL.Component(ICAL.parse(text));
  for (const tz of root.getAllSubcomponents('vtimezone')) ICAL.TimezoneService.register(tz);

  const masters: IcalEvent[] = [];
  const exceptions = new Map<string, IcalEvent[]>();
  for (const v of root.getAllSubcomponents('vevent')) {
    const ev = new ICAL.Event(v);
    if (ev.isRecurrenceException()) exceptions.set(ev.uid, [...(exceptions.get(ev.uid) ?? []), ev]);
    else masters.push(ev);
  }

  const fromMs = from.getTime();
  const toMs = to.getTime();
  const out: CalEvent[] = [];

  const add = (item: IcalEvent, start: IcalTime, end: IcalTime) => {
    if (start.isDate) return; // all-day events don't need a leave time
    if (item.component.getFirstPropertyValue('status') === 'CANCELLED') return;
    const s = toDate(start, tzidOf(item, 'dtstart'));
    if (s.getTime() < fromMs || s.getTime() > toMs) return;
    out.push({
      key: `ics:${item.uid}@${s.getTime()}`,
      title: item.summary || 'Untitled event',
      start: s,
      end: toDate(end, tzidOf(item, 'dtend') ?? tzidOf(item, 'dtstart')),
      location: item.location?.trim() || null,
      calendarTitle: source,
    });
  };

  for (const ev of masters) {
    if (!ev.isRecurring()) {
      add(ev, ev.startDate, ev.endDate);
      continue;
    }
    for (const ex of exceptions.get(ev.uid) ?? []) ev.relateException(ex);

    // Walk occurrences from the series start; old daily series can be long, hence the cap.
    const it = ev.iterator();
    for (let i = 0, next = it.next(); next && i < 50_000; i++, next = it.next()) {
      if (next.toJSDate().getTime() > toMs) break;
      const d = ev.getOccurrenceDetails(next);
      add(d.item, d.startDate, d.endDate);
    }
  }

  // A moved occurrence whose series isn't in the file (rare) still counts.
  const masterUids = new Set(masters.map((m) => m.uid));
  for (const [uid, list] of exceptions) {
    if (!masterUids.has(uid)) list.forEach((ex) => add(ex, ex.startDate, ex.endDate));
  }

  return out;
}

function tzidOf(item: IcalEvent, prop: 'dtstart' | 'dtend'): string | undefined {
  const p = item.component.getFirstProperty(prop)?.getParameter('tzid');
  return typeof p === 'string' ? p : undefined;
}

/**
 * Converts an iCal time to a Date. If the file names a timezone without defining it
 * (ical.js would then treat it as local time), let Intl's timezone database work out the offset.
 */
function toDate(t: IcalTime, tzid: string | undefined): Date {
  if (!tzid || t.zone === ICAL.Timezone.utcTimezone || ICAL.TimezoneService.has(tzid)) return t.toJSDate();
  try {
    const fmt = new Intl.DateTimeFormat('en-US', {
      timeZone: tzid,
      hourCycle: 'h23',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
    // Offset of `tzid` from UTC at a given instant.
    const offsetAt = (ms: number) => {
      const parts = Object.fromEntries(fmt.formatToParts(ms).map((x) => [x.type, Number(x.value)]));
      return Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second) - ms;
    };
    const wall = Date.UTC(t.year, t.month - 1, t.day, t.hour, t.minute, t.second);
    // Two passes so times near a DST change land on the right side of it.
    return new Date(wall - offsetAt(wall - offsetAt(wall)));
  } catch {
    return t.toJSDate(); // unknown timezone name: fall back to local time
  }
}
