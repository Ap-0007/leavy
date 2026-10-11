import Ionicons from '@expo/vector-icons/Ionicons';
import * as AppleAuthentication from 'expo-apple-authentication';
import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { useAuth } from '../lib/auth';
import { radius, space, type, useTheme } from '../theme';

/** "Continue with Apple / Google" buttons with their own busy and error states. */
export function SignInButtons() {
  const t = useTheme();
  const { configured, googleReady, appleReady, signInWithGoogle, signInWithApple } = useAuth();
  const [busy, setBusy] = useState<'google' | 'apple' | null>(null);
  const [error, setError] = useState<string | null>(null);

  const run = async (which: 'google' | 'apple') => {
    setBusy(which);
    setError(null);
    try {
      await (which === 'google' ? signInWithGoogle() : signInWithApple());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Sign-in failed. Try again.');
    } finally {
      setBusy(null);
    }
  };

  if (!configured || (!googleReady && !appleReady)) {
    return (
      <Text style={[type.caption, { color: t.textMuted, textAlign: 'center' }]}>
        {!configured
          ? 'Accounts aren’t set up in this build yet. Add the Supabase keys to .env.local (see README).'
          : 'Sign-in needs a development build. Expo Go can’t run it.'}
      </Text>
    );
  }

  return (
    <View style={{ gap: space.md }}>
      {appleReady ? (
        <View pointerEvents={busy ? 'none' : 'auto'} style={{ opacity: busy && busy !== 'apple' ? 0.5 : 1 }}>
          <AppleAuthentication.AppleAuthenticationButton
            buttonType={AppleAuthentication.AppleAuthenticationButtonType.CONTINUE}
            buttonStyle={t.dark ? AppleAuthentication.AppleAuthenticationButtonStyle.WHITE : AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
            cornerRadius={radius.md}
            style={styles.apple}
            onPress={() => run('apple')}
          />
        </View>
      ) : null}
      {googleReady ? (
        <Pressable
          onPress={() => run('google')}
          disabled={busy !== null}
          accessibilityRole="button"
          accessibilityLabel="Continue with Google"
          style={({ pressed }) => [
            styles.google,
            { backgroundColor: t.surface, borderColor: t.border },
            (pressed || (busy && busy !== 'google')) && { opacity: 0.6 },
          ]}
        >
          {busy === 'google' ? <ActivityIndicator color={t.text} /> : <Ionicons name="logo-google" size={18} color={t.text} />}
          <Text style={[type.bodyStrong, { color: t.text }]}>Continue with Google</Text>
        </Pressable>
      ) : null}
      {error ? (
        <Text role="alert" accessibilityLiveRegion="polite" style={[type.caption, { color: t.status.late.fg, textAlign: 'center' }]}>
          {error}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  apple: { width: '100%', height: 50 },
  google: {
    minHeight: 50,
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.sm,
  },
});
