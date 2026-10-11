import { Platform } from 'react-native';

// Native Google Sign-In. The same Google session signs you in to Leavy (through Supabase)
// and lets the app read Google Calendar with an access token.

export const CALENDAR_SCOPE = 'https://www.googleapis.com/auth/calendar.readonly';

const webClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
const iosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;

type GoogleModule = typeof import('@react-native-google-signin/google-signin');
let cached: GoogleModule | null | undefined;

/** The native module is missing in Expo Go and on web, so load it lazily instead of crashing on import. */
function load(): GoogleModule | null {
  if (cached !== undefined) return cached;
  cached = null;
  if (Platform.OS === 'web' || !webClientId || (Platform.OS === 'ios' && !iosClientId)) return null;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod: GoogleModule = require('@react-native-google-signin/google-signin');
    mod.GoogleSignin.configure({ webClientId, iosClientId, scopes: [CALENDAR_SCOPE] });
    cached = mod;
  } catch {
    // Expo Go: no native module. Sign-in needs a development build.
  }
  return cached;
}

export function googleAvailable(): boolean {
  return load() !== null;
}

export interface GoogleResult {
  idToken: string | null;
  email: string;
  name: string | null;
  /** Whether the user allowed calendar access. Google lets them untick it on the consent screen. */
  calendar: boolean;
}

/** Opens Google's sign-in sheet. Resolves null if the user cancels. */
export async function googleSignIn(): Promise<GoogleResult | null> {
  const mod = load();
  if (!mod) throw new Error('Google sign-in needs a development build with Google client IDs set.');
  const { GoogleSignin, isErrorWithCode, isSuccessResponse, statusCodes } = mod;
  try {
    await GoogleSignin.hasPlayServices();
    const res = await GoogleSignin.signIn();
    if (!isSuccessResponse(res)) return null;
    let scopes = res.data.scopes;
    if (!scopes.includes(CALENDAR_SCOPE)) {
      const more = await GoogleSignin.addScopes({ scopes: [CALENDAR_SCOPE] });
      if (more && isSuccessResponse(more)) scopes = more.data.scopes;
    }
    return {
      idToken: res.data.idToken,
      email: res.data.user.email,
      name: res.data.user.name,
      calendar: scopes.includes(CALENDAR_SCOPE),
    };
  } catch (e) {
    if (isErrorWithCode(e)) {
      if (e.code === statusCodes.SIGN_IN_CANCELLED || e.code === statusCodes.IN_PROGRESS) return null;
      if (e.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) throw new Error('Google Play services are missing or out of date.');
    }
    throw e;
  }
}

/** Restores the native session after an app restart so tokens can be fetched. */
async function ensureSignedIn(mod: GoogleModule): Promise<boolean> {
  const { GoogleSignin } = mod;
  if (GoogleSignin.getCurrentUser()) return true;
  if (!GoogleSignin.hasPreviousSignIn()) return false;
  const res = await GoogleSignin.signInSilently();
  return res.type === 'success';
}

export async function googleAccessToken(): Promise<string> {
  const mod = load();
  if (!mod || !(await ensureSignedIn(mod))) throw new Error('Google Calendar is disconnected. Connect it again in Settings.');
  return (await mod.GoogleSignin.getTokens()).accessToken;
}

/** Android caches tokens; drop a rejected one so the next getTokens() fetches a fresh one. */
export async function forgetGoogleToken(token: string) {
  await load()?.GoogleSignin.clearCachedAccessToken(token);
}

export async function googleSignOut() {
  const mod = load();
  if (mod) await mod.GoogleSignin.signOut().catch(() => {});
}
