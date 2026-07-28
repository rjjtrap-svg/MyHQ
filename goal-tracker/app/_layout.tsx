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
import { useCommissionStore } from '@/src/store/commissionStore';
import { useDoorKnocksStore } from '@/src/store/doorKnocksStore';
import { usePitchCoachStore } from '@/src/store/pitchCoachStore';
import { useCoachChatStore } from '@/src/store/coachChatStore';
import { useSettingsStore } from '@/src/store/settingsStore';
import { useUIStore } from '@/src/store/uiStore';
import { syncDailyReminder } from '@/src/lib/notifications';
import { registerWebPushToken } from '@/src/lib/push';
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
  const teamMembers = useTeamStore((s) => s.members);
  const subscribeDeals = useDealsStore((s) => s.subscribe);
  const subscribeCommissions = useCommissionStore((s) => s.subscribe);
  const subscribeDoorKnocks = useDoorKnocksStore((s) => s.subscribe);
  const subscribePitchSubs = usePitchCoachStore((s) => s.subscribe);
  const subscribeCoachChat = useCoachChatStore((s) => s.subscribe);
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
    if (!profile?.teamId || !firebaseUser) return;
    const unsubTeam = subscribeTeam(profile.teamId);
    const unsubDeals = subscribeDeals(profile.teamId);
    const unsubCommissions = subscribeCommissions(profile.teamId, firebaseUser.uid, profile.role === 'manager');
    const unsubDoorKnocks = subscribeDoorKnocks(profile.teamId, firebaseUser.uid);
    const unsubPitchSubs = subscribePitchSubs(profile.teamId, firebaseUser.uid);
    const unsubCoachChat = subscribeCoachChat(profile.teamId, firebaseUser.uid);
    return () => {
      unsubTeam();
      unsubDeals();
      unsubCommissions();
      unsubDoorKnocks();
      unsubPitchSubs();
      unsubCoachChat();
    };
  }, [profile?.teamId, profile?.role, firebaseUser?.uid]);

  // Web push registration is opt-in (see Settings) and only meaningful once we know the
  // user's team; safe to call repeatedly since it's a no-op if permission isn't granted yet.
  useEffect(() => {
    if (!profile?.teamId || !firebaseUser) return;
    registerWebPushToken(firebaseUser.uid, profile.teamId).catch(() => {});
  }, [profile?.teamId, firebaseUser?.uid]);

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

  return (
    <ThemeProvider value={navigationTheme}>
      <StatusBar style="dark" />
      <Stack screenOptions={{ contentStyle: { backgroundColor: colors.background } }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="add-deal" options={{ presentation: 'modal', headerShown: false }} />
        <Stack.Screen name="auth" options={{ headerShown: false }} />
      </Stack>
    </ThemeProvider>
  );
}
