import { isRunningInExpoGo } from 'expo';
import { Platform } from 'react-native';

import type { Trip } from '../types';
import { formatMinutes, formatTime, MODE_NOUN } from './format';

const PREFIX = 'wtl-';
const CHANNEL = 'leave-alerts';

type NotificationsModule = typeof import('expo-notifications');

/**
 * Expo Go on Android throws as soon as expo-notifications is imported (push support was removed
 * in SDK 53), which breaks every route that imports this file. Skip alerts there, and on web.
 */
const Notifications: NotificationsModule | null =
  Platform.OS === 'web' || (Platform.OS === 'android' && isRunningInExpoGo())
    ? null
    : // eslint-disable-next-line @typescript-eslint/no-require-imports
      require('expo-notifications');

if (Notifications) {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

export async function ensureNotificationPermission(): Promise<boolean> {
  if (!Notifications) return false;
  try {
    if (Platform.OS === 'android') {
      // Android 13+ only shows the permission prompt once a channel exists.
      await Notifications.setNotificationChannelAsync(CHANNEL, {
        name: 'Leave alerts',
        importance: Notifications.AndroidImportance.HIGH,
      });
    }
    const current = await Notifications.getPermissionsAsync();
    if (current.granted) return true;
    if (!current.canAskAgain) return false;
    return (await Notifications.requestPermissionsAsync()).granted;
  } catch {
    return false;
  }
}

/** Replaces every alert this app scheduled with fresh ones for the given trips. */
export async function syncLeaveAlerts(trips: Trip[], headsUpMin: number): Promise<void> {
  if (!Notifications) return;
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  await Promise.all(
    scheduled
      .filter((n) => n.identifier.startsWith(PREFIX))
      .map((n) => Notifications.cancelScheduledNotificationAsync(n.identifier)),
  );

  const now = Date.now();
  for (const trip of trips) {
    if (!trip.route || !trip.notify) continue;
    const leaveAt = trip.route.leaveBy.getTime();
    const travel = `${formatMinutes(trip.route.durationSec / 60)} ${MODE_NOUN[trip.mode]}`;
    const id = `${PREFIX}${trip.event.key}`;

    if (headsUpMin > 0 && leaveAt - headsUpMin * 60_000 > now) {
      await schedule(Notifications, `${id}-heads`, leaveAt - headsUpMin * 60_000, {
        title: `Leave in ${headsUpMin} min for ${trip.event.title}`,
        body: `Head out at ${formatTime(trip.route.leaveBy)} · ${travel}`,
      });
    }
    if (leaveAt > now) {
      await schedule(Notifications, `${id}-leave`, leaveAt, {
        title: `Time to leave for ${trip.event.title}`,
        body: `${travel} · arrive by ${formatTime(trip.arriveBy)}`,
      });
    }
  }
}

function schedule(N: NotificationsModule, identifier: string, at: number, content: { title: string; body: string }) {
  return N.scheduleNotificationAsync({
    identifier,
    content: { ...content, data: { url: '/' } },
    trigger: {
      type: N.SchedulableTriggerInputTypes.DATE,
      date: at,
      channelId: Platform.OS === 'android' ? CHANNEL : undefined,
    },
  });
}
