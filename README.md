# Leavy

A calm little mobile app that reads your calendar, checks live travel time with Google Maps, and tells you **when to leave** for each event, including a grace period so you arrive a few minutes early.

- **Calendars:** paste a private **calendar link** (Google "secret iCal address" or iCloud share link), which works in Expo Go. In a development build, it can also read the phone's calendars directly (`expo-calendar`).
- **Travel time:** uses the Google **Routes API**, with live traffic for driving and real schedules for transit. Walking and cycling are supported too.
- **Grace period:** set a global "arrive N min early", and override it per event.
- **Alerts:** sends a local notification when it's time to leave, plus an optional heads-up. Alerts can be muted per event.
- **Demo mode:** sample events, so the UI works in Expo Go, on web, or before you have an API key.

Built with Expo SDK 57, Expo Router and TypeScript.

## How the leave time is worked out

```
arrive by = event start − grace period
leave by  = arrive by − travel time
```

- **Driving:** traffic depends on when you drive, so it asks the Routes API twice. The first request uses "now" to estimate your departure, and the second uses that departure time.
- **Transit:** it requests a route that *arrives by* your target. Then it backs off the walk to the first stop, so "leave by" matches the actual bus or train.
- **Status:** *On track* (more than 15 min to go) → *Leave soon* → *Leave now* (eating into your grace period, still on time) → *Running late* (shows how late you'd be).

Route results are cached for 5 minutes. The app refreshes when it opens, when you pull down, and every 5 minutes while it's open.

## Setup

```bash
npm install
```

### 1. Google Maps API key

1. Go to <https://console.cloud.google.com/>, create a project, and enable billing. Google's free monthly credit covers personal use.
2. Under **APIs & Services → Library**, enable **Routes API**.
3. Under **APIs & Services → Credentials**, create an **API key**.
4. Restrict the key. Under *API restrictions*, allow only **Routes API**. Under *Application restrictions*, add your app's bundle ID (`com.langchen.leavy`) once you ship it. The key ships inside the app, so restricting it matters.
5. Copy `.env.example` to `.env.local` and paste the key:

   ```
   EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=your-key-here
   ```

6. Restart `npx expo start` so the key is picked up. `.env` and `.env.local` are git-ignored.

### 2. Add your calendar

In the app, open **Settings → Your calendar** and paste a link. The app shows these steps too:

- **Google Calendar** (desktop site only):
  1. Go to **calendar.google.com/calendar/r/settings**. On iPhone, open it in Safari → **aA** → *Request Desktop Website*.
  2. In the left menu, scroll to **Settings for my calendars** and click your name.
  3. On the right, scroll to **Integrate calendar** and copy **Secret address in iCal format** (ends in `/basic.ics`).
  4. Can't find it? School and work accounts often have it turned off. Use a personal Gmail calendar or iCloud instead.
- **iCloud** (on iPhone): Calendar app → Calendars → ⓘ next to a calendar → turn on **Public Calendar** → *Share Link…* → Copy.

Treat these links like passwords. Google refreshes them every few hours, so new events can lag. Browsers block calendar links, so use the phone.

### 3. Run it

**On your phone with Expo Go:** `npx expo start`, then scan the QR code with Expo Go. On school or work Wi-Fi that blocks devices from reaching each other, use `npx expo start --tunnel`. Until you add a calendar link, the app shows sample events.

**Real calendars on your phone:** `expo-calendar` needs a [development build](https://docs.expo.dev/develop/development-builds/introduction/):

```bash
npx expo run:android            # Android device/emulator (needs Android Studio)
npx eas-cli@latest build --profile development --platform ios   # iPhone, built in the cloud
```

To use Google Calendar, add your Google account to the phone (iOS: Settings → Calendar → Accounts; Android: it's usually already there). Its calendars then show up in the app's Settings tab.

## Project layout

```
src/
  app/                 Expo Router screens
    (tabs)/index.tsx   Upcoming: next-trip hero card + later trips
    (tabs)/settings.tsx
    trip/[id].tsx      Timeline, per-event mode / grace / alert overrides
  components/          ModePicker, GraceStepper, StatusPill, TripViews, shared UI
  lib/
    calendar.ts        Device calendars → events
    ics.ts             iCal parser: repeating events, moved/cancelled ones, timezones
    icsFeed.ts         Calendar links: download, cache, validate
    routes.ts          Google Routes API (traffic-aware drive, transit arrive-by)
    plan.ts            Leave-time status rules
    notifications.ts   Local leave alerts
    trips.tsx          Pulls it all together; refresh loop
    settings.tsx       Persisted settings (AsyncStorage)
    demo.ts            Sample data
  theme.ts             Light/dark tokens, type scale, spacing
```

## Known limits

- Alerts are scheduled when the app refreshes. If traffic changes a lot while the app is closed, the alert time won't move until you open the app again. A background fetch task would fix this.
- Per-event settings apply to one occurrence of a recurring event.
- Travel time is measured from your current location, not from where your previous event ends.
