# Setup: API keys, sign-in and calendars

None of this is needed to try the app: without keys it runs in demo mode with sample events. Follow these steps when you want live travel times, sign-in or real calendars.

## 1. Google Maps API key

1. Go to <https://console.cloud.google.com/>, create a project, and enable billing. Google's free monthly credit covers personal use.
2. Under **APIs & Services → Library**, enable **Routes API**.
3. Under **APIs & Services → Credentials**, create an **API key**.
4. Restrict the key. Under *API restrictions*, allow only **Routes API**. Under *Application restrictions*, add your app's bundle ID (`com.langchen.leavy`) once you ship it. The key ships inside the app, so restricting it matters.
5. Copy `.env.example` to `.env.local` and paste the key:

   ```
   EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=your-key-here
   ```

6. Restart `npx expo start` so the key is picked up. `.env` and `.env.local` are git-ignored.

## 2. Accounts and calendar sign-in (Supabase, Google, Apple)

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

## 3. Or add a calendar link

In the app, open **Connections → Calendar links** and paste a link. The app shows these steps too:

- **Google Calendar** (desktop site only):
  1. Go to **calendar.google.com/calendar/r/settings**. On iPhone, open it in Safari → **aA** → *Request Desktop Website*.
  2. In the left menu, scroll to **Settings for my calendars** and click your name.
  3. On the right, scroll to **Integrate calendar** and copy **Secret address in iCal format** (ends in `/basic.ics`).
  4. Can't find it? School and work accounts often have it turned off. Use a personal Gmail calendar or iCloud instead.
- **iCloud** (on iPhone): Calendar app → Calendars → ⓘ next to a calendar → turn on **Public Calendar** → *Share Link…* → Copy.

Treat these links like passwords. Google refreshes them every few hours, so new events can lag. Browsers block calendar links, so use the phone.

