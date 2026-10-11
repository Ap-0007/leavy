import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Session } from '@supabase/supabase-js';
import * as AppleAuthentication from 'expo-apple-authentication';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { Platform } from 'react-native';

import { requestCalendarAccess } from './calendar';
import { googleAvailable, googleSignIn, googleSignOut } from './google';
import { useSettings } from './settings';
import { supabase } from './supabase';

export interface Account {
  id: string;
  email: string | null;
  name: string | null;
  provider: 'google' | 'apple' | string;
}

interface AuthContextValue {
  ready: boolean;
  account: Account | null;
  /** Chose "Not now" on the welcome screen. */
  guest: boolean;
  /** Supabase keys are set, so accounts work. */
  configured: boolean;
  googleReady: boolean;
  appleReady: boolean;
  /** Each resolves false if the user cancelled. */
  signInWithGoogle: () => Promise<boolean>;
  signInWithApple: () => Promise<boolean>;
  continueAsGuest: () => void;
  signOut: () => Promise<void>;
}

const GUEST_KEY = 'leavy.guest';

const AuthContext = createContext<AuthContextValue | null>(null);

function requireSupabase() {
  if (!supabase) throw new Error('Accounts aren’t set up yet. Add the Supabase keys to .env.local (see README).');
  return supabase;
}

function toAccount(session: Session | null): Account | null {
  const u = session?.user;
  if (!u) return null;
  const meta = u.user_metadata ?? {};
  return {
    id: u.id,
    email: u.email ?? null,
    name: meta.full_name ?? meta.name ?? null,
    provider: u.app_metadata?.provider ?? 'email',
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const { update } = useSettings();
  const [session, setSession] = useState<Session | null>(null);
  const [guest, setGuest] = useState(false);
  const [ready, setReady] = useState(false);
  const [appleReady, setAppleReady] = useState(false);

  useEffect(() => {
    Promise.all([
      AsyncStorage.getItem(GUEST_KEY).then((v) => setGuest(v === '1')).catch(() => {}),
      supabase?.auth.getSession().then(({ data }) => setSession(data.session)),
      Platform.OS === 'ios' ? AppleAuthentication.isAvailableAsync().then(setAppleReady).catch(() => {}) : null,
    ]).finally(() => setReady(true));
    const sub = supabase?.auth.onAuthStateChange((_event, s) => setSession(s));
    return () => sub?.data.subscription.unsubscribe();
  }, []);

  const signInWithGoogle = useCallback(async () => {
    const sb = requireSupabase();
    const res = await googleSignIn();
    if (!res) return false;
    if (!res.idToken) throw new Error('Google didn’t return an ID token. Check EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID.');
    const { error } = await sb.auth.signInWithIdToken({ provider: 'google', token: res.idToken });
    if (error) throw error;
    // The same consent screen granted calendar access, so start loading it right away.
    update(res.calendar ? { googleCalendar: true, demoMode: false } : {});
    return true;
  }, [update]);

  const signInWithApple = useCallback(async () => {
    const sb = requireSupabase();
    let credential: AppleAuthentication.AppleAuthenticationCredential;
    try {
      credential = await AppleAuthentication.signInAsync({
        requestedScopes: [AppleAuthentication.AppleAuthenticationScope.FULL_NAME, AppleAuthentication.AppleAuthenticationScope.EMAIL],
      });
    } catch (e) {
      if ((e as { code?: string }).code === 'ERR_REQUEST_CANCELED') return false;
      throw e;
    }
    if (!credential.identityToken) throw new Error('Apple didn’t return an identity token.');
    const { error } = await sb.auth.signInWithIdToken({ provider: 'apple', token: credential.identityToken });
    if (error) throw error;
    // Apple only sends the name on the very first sign-in, so save it now.
    const { givenName, middleName, familyName } = credential.fullName ?? {};
    const fullName = [givenName, middleName, familyName].filter(Boolean).join(' ');
    if (fullName) await sb.auth.updateUser({ data: { full_name: fullName, given_name: givenName, family_name: familyName } });
    // Apple has no calendar API; iCloud calendars are read on the phone through EventKit.
    await requestCalendarAccess();
    update({ demoMode: false });
    return true;
  }, [update]);

  const continueAsGuest = useCallback(() => {
    setGuest(true);
    AsyncStorage.setItem(GUEST_KEY, '1').catch(() => {});
  }, []);

  const signOut = useCallback(async () => {
    await supabase?.auth.signOut();
    await googleSignOut();
    update({ googleCalendar: false });
    setGuest(false);
    AsyncStorage.removeItem(GUEST_KEY).catch(() => {});
  }, [update]);

  const value = useMemo(
    () => ({
      ready,
      account: toAccount(session),
      guest,
      configured: supabase !== null,
      googleReady: googleAvailable(),
      appleReady,
      signInWithGoogle,
      signInWithApple,
      continueAsGuest,
      signOut,
    }),
    [ready, session, guest, appleReady, signInWithGoogle, signInWithApple, continueAsGuest, signOut],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
