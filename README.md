# Leavy

A calm little mobile app that reads your calendar, checks live travel time with Google Maps, and tells you **when to leave** for each event, including a grace period so you arrive a few minutes early.

- **Accounts:** sign in with **Google** or **Apple** through Supabase Auth. Your preferences sync to your account in Supabase.
- **Calendars:** Google sign-in also connects **Google Calendar** through the Google Calendar API. Apple sign-in reads the iPhone's calendars, including iCloud. You can also paste a private **calendar link** (Google "secret iCal address" or iCloud share link), which works in Expo Go. In a development build, it can also read the phone's calendars directly (`expo-calendar`).
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

### 2. Accounts and calendar sign-in (Supabase, Google, Apple)

Sign-in is optional. Without it, choose **Continue as guest** on the welcome screen and use calendar links instead. Sign-in uses native modules, so it needs a [development build](https://docs.expo.dev/develop/development-builds/introduction/), not Expo Go.

**Supabase**

1. Create a project at <https://supabase.com/dashboard>.
2. In the SQL editor, run `supabase/migrations/20261011000000_user_settings.sql`. It creates the `user_settings` table with row-level security. With the Supabase CLI, run `supabase db push` instead.
3. From **Connect** (or Project Settings → API), copy the project URL and publishable key into `.env.local`:

   ```
   EXPO_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
   EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
   ```

**Google** (sign-in plus Google Calendar)

1. In the Google Cloud Console project you use for Maps, enable the **Google Calendar API**.
2. Set up the **OAuth consent screen** and add the scope `.../auth/calendar.readonly`. While the app is in *Testing*, add your Google account as a test user. Up to 100 test users work without Google's verification review.
3. Under **Credentials**, create three OAuth client IDs:
   - **Web application**: used by Supabase and as `webClientId`.
   - **iOS**: bundle ID `com.langchen.leavy`.
   - **Android**: package `com.langchen.leavy` plus the SHA-1 of your signing key. For EAS builds, run `npx eas-cli@latest credentials`.
4. Add the IDs to `.env.local`:

   ```
   EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=....apps.googleusercontent.com
   EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=....apps.googleusercontent.com
   ```

   `app.config.ts` turns the iOS ID into the URL scheme the native module needs.
5. In Supabase, go to **Authentication → Sign In / Providers → Google** and turn it on. Paste the Web, iOS and Android client IDs, comma-separated with the Web one first, along with the Web client secret. If iOS sign-in fails with a nonce error, turn on **Skip nonce check**.

**Apple** (iPhone only)

1. In the Apple Developer portal, turn on **Sign in with Apple** for the App ID `com.langchen.leavy`. EAS does this when it builds, because `usesAppleSignIn` is set.
2. In Supabase, go to **Authentication → Sign In / Providers → Apple**, turn it on, and add `com.langchen.leavy` to **Client IDs**. Native sign-in doesn't need the Services ID or signing key.

Apple has no calendar API. After Apple sign-in, the app asks for access to the calendars on the iPhone, which include iCloud. Android users with an iCloud calendar can use a calendar link.

**What's stored where:** Supabase stores your account and preferences (grace period, travel mode, alerts, per-event overrides). Calendar links, Google tokens and event data stay on the phone. The Google Sign-In SDK manages its own tokens.

### 3. Or add a calendar link

In the app, open **Connections → Calendar links** and paste a link. The app shows these steps too:

- **Google Calendar** (desktop site only):
  1. Go to **calendar.google.com/calendar/r/settings**. On iPhone, open it in Safari → **aA** → *Request Desktop Website*.
  2. In the left menu, scroll to **Settings for my calendars** and click your name.
  3. On the right, scroll to **Integrate calendar** and copy **Secret address in iCal format** (ends in `/basic.ics`).
  4. Can't find it? School and work accounts often have it turned off. Use a personal Gmail calendar or iCloud instead.
- **iCloud** (on iPhone): Calendar app → Calendars → ⓘ next to a calendar → turn on **Public Calendar** → *Share Link…* → Copy.

Treat these links like passwords. Google refreshes them every few hours, so new events can lag. Browsers block calendar links, so use the phone.

### 4. Run it

**On your phone with Expo Go:** `npx expo start`, then scan the QR code with Expo Go. On school or work Wi-Fi that blocks devices from reaching each other, use `npm run tunnel`. It goes through a free Cloudflare tunnel (needs [`cloudflared`](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/)), because Expo's built-in `--tunnel` currently fails. Until you add a calendar link, the app shows sample events.

**On the Android emulator:** start the emulator, then run `npm run android`. It serves the app on `localhost` (forwarded into the emulator with `adb reverse`), because firewalls and campus Wi-Fi often block the emulator from reaching your computer's network address. Leave alerts are off in Expo Go on Android; they need a development build.

**Android development build:** `npx expo run:android` builds and installs Leavy on the running emulator. It needs the Android SDK (`ANDROID_HOME`) and **Java 17** (`JAVA_HOME`); newer Java versions such as 25 fail in the CMake steps with "A restricted method in java.lang.System has been called".

**Sign-in and real calendars on your phone:** Google/Apple sign-in and `expo-calendar` need a [development build](https://docs.expo.dev/develop/development-builds/introduction/):

```bash
npx expo run:android            # Android device/emulator (needs Android Studio)
npx eas-cli@latest build --profile development --platform ios   # iPhone, built in the cloud
```

To use Google Calendar, add your Google account to the phone (iOS: Settings → Calendar → Accounts; Android: it's usually already there). Its calendars then show up in the app's Connections tab.

## Project layout

```
src/
  app/                 Expo Router screens
    sign-in.tsx        Welcome screen: logo, Apple / Google sign-in or guest
    (tabs)/index.tsx        Upcoming: next-trip hero card + later trips
    (tabs)/connections.tsx  Account, Google / phone calendars, calendar links, demo mode
    (tabs)/preferences.tsx  Arrive early by, travel mode, alerts, look ahead
    trip/[id].tsx      Timeline, per-event mode / grace / alert overrides
  components/          AccountSettings, SignInButtons, Logo, ModePicker, GraceStepper, StatusPill, TripViews, shared UI
  lib/
    auth.tsx           Supabase Auth session; Google and Apple sign-in
    supabase.ts        Supabase client
    cloudSync.ts       Syncs preferences to the user_settings table
    google.ts          Native Google Sign-In, calendar scope and access tokens
    googleCalendar.ts  Google Calendar API → events
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
supabase/migrations/   Database schema (user_settings + row-level security)
app.config.ts          Adds the Google Sign-In plugin when the iOS client ID is set
```

## Known limits

- Alerts are scheduled when the app refreshes. If traffic changes a lot while the app is closed, the alert time won't move until you open the app again. A background fetch task would fix this.
- Per-event settings apply to one occurrence of a recurring event.
- Travel time is measured from your current location, not from where your previous event ends.
