import type { Trip, TripStatus } from '../types';

/** Below this many minutes until "leave by", the trip turns amber. */
const SOON_MIN = 15;

export interface TripTiming {
  status: TripStatus;
  /** Minutes until you need to leave (negative once that moment has passed). */
  minToLeave: number;
  /** Minutes you'd be late for the event start if you left right now (0 if on time). */
  lateByMin: number;
}

export function timingFor(trip: Trip, now: number): TripTiming {
  if (!trip.route) return { status: 'unknown', minToLeave: 0, lateByMin: 0 };

  const minToLeave = (trip.route.leaveBy.getTime() - now) / 60_000;
  const arriveIfLeavingNow = now + trip.route.durationSec * 1000;
  const lateByMin = Math.max(0, (arriveIfLeavingNow - trip.event.start.getTime()) / 60_000);

  let status: TripStatus;
  if (minToLeave > SOON_MIN) status = 'relaxed';
  else if (minToLeave > 0) status = 'soon';
  // Past "leave by" but still inside the grace period: go now and you're still on time.
  else if (lateByMin < 1) status = 'now';
  else status = 'late';

  return { status, minToLeave, lateByMin };
}

export const STATUS_LABEL: Record<TripStatus, string> = {
  relaxed: 'On track',
  soon: 'Leave soon',
  now: 'Leave now',
  late: 'Running late',
  unknown: 'No estimate',
};

export const STATUS_ICON = {
  relaxed: 'checkmark-circle',
  soon: 'time',
  now: 'walk',
  late: 'alert-circle',
  unknown: 'help-circle',
} as const satisfies Record<TripStatus, string>;
