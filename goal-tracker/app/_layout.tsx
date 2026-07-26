import React, { useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { DarkTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { useAuthStore } from '@/src/store/authStore';
import { useTeamStore } from '@/src/store/teamStore';
import { useDealsStore } from '@/src/store/dealsStore';
import { useSettingsStore } from '@/src/store/settingsStore';
import { useUIStore } from '@/src/store/uiStore';
import { syncDailyReminder } from '@/src/lib/notifications';
import { colors } from '@/src/theme';

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

SplashScreen.preventAutoHideAsync();

const navigationTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: colors.background,
    card: colors.surface,
    text: colors.text,
    border: colors.border,
    primary: colors.primary,
  },
};

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    ...FontAwesome.font,
  });
  const [personalDataReady, setPersonalDataReady] = useState(false);

  const initAuth = useAuthStore((s) => s.init);
  const authInitialized = useAuthStore((s) => s.initialized);
  const firebaseUser = useAuthStore((s) => s.firebaseUser);
  const profile = useAuthStore((s) => s.profile);

  const subscribeTeam = useTeamStore((s) => s.subscribe);
  const subscribeDeals = useDealsStore((s) => s.subscribe);
  const hydrateSettings = useSettingsStore((s) => s.hydrate);
  const hydrateUI = useUIStore((s) => s.hydrate);

  useEffect(() => {
    if (fontError) throw fontError;
  }, [fontError]);

  // Personal (per-device) preferences: goal targets and reminder times, unrelated to the team.
  useEffect(() => {
    (async () => {
      await Promise.all([hydrateSettings(), hydrateUI()]);
      setPersonalDataReady(true);
    })();
  }, []);

  useEffect(() => initAuth(), []);

  // Once we know which team the signed-in user belongs to, subscribe to its live data.
  useEffect(() => {
    if (!profile?.teamId) return;
    const unsubTeam = subscribeTeam(profile.teamId);
    const unsubDeals = subscribeDeals(profile.teamId);
    return () => {
      unsubTeam();
      unsubDeals();
    };
  }, [profile?.teamId]);

  const appReady = fontsLoaded && personalDataReady && authInitialized;

  useEffect(() => {
    if (appReady) {
      SplashScreen.hideAsync();
    }
  }, [appReady]);

  // Keep the daily reminder content fresh whenever the app is reopened.
  const appState = useRef(AppState.currentState);
  useEffect(() => {
    const sub = AppState.addEventListener('change', (next) => {
      if (appState.current.match(/inactive|background/) && next === 'active') {
        const { settings } = useSettingsStore.getState();
        const { deals } = useDealsStore.getState();
        syncDailyReminder(settings, deals);
      }
      appState.current = next;
    });
    return () => sub.remove();
  }, []);

  useEffect(() => {
    if (!personalDataReady) return;
    const { settings } = useSettingsStore.getState();
    const { deals } = useDealsStore.getState();
    syncDailyReminder(settings, deals);
  }, [personalDataReady]);

  if (!appReady) {
    return null;
  }

  const signedIn = Boolean(firebaseUser && profile);

  return (
    <ThemeProvider value={navigationTheme}>
      <StatusBar style="light" />
      <Stack screenOptions={{ contentStyle: { backgroundColor: colors.background } }}>
        {signedIn ? (
          <>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="add-deal" options={{ presentation: 'modal', headerShown: false }} />
          </>
        ) : (
          <Stack.Screen name="auth" options={{ headerShown: false }} />
        )}
      </Stack>
    </ThemeProvider>
  );
}
