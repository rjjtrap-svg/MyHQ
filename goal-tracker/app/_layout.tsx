import React, { useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import NetInfo from '@react-native-community/netinfo';
import { DarkTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { useDealsStore } from '@/src/store/dealsStore';
import { useSettingsStore } from '@/src/store/settingsStore';
import { useUIStore } from '@/src/store/uiStore';
import { syncDailyReminder } from '@/src/lib/notifications';
import { colors } from '@/src/theme';

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

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
  const [dataReady, setDataReady] = useState(false);

  const hydrateDeals = useDealsStore((s) => s.hydrate);
  const hydrateSettings = useSettingsStore((s) => s.hydrate);
  const hydrateUI = useUIStore((s) => s.hydrate);
  const retrySync = useDealsStore((s) => s.retrySync);

  useEffect(() => {
    if (fontError) throw fontError;
  }, [fontError]);

  useEffect(() => {
    (async () => {
      await Promise.all([hydrateDeals(), hydrateSettings(), hydrateUI()]);
      setDataReady(true);
    })();
  }, []);

  useEffect(() => {
    if (fontsLoaded && dataReady) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, dataReady]);

  // Keep the daily reminder content fresh whenever the app is reopened, and
  // retry any deals that failed to sync while offline.
  const appState = useRef(AppState.currentState);
  useEffect(() => {
    const sub = AppState.addEventListener('change', (next) => {
      if (appState.current.match(/inactive|background/) && next === 'active') {
        const { settings } = useSettingsStore.getState();
        const { deals } = useDealsStore.getState();
        syncDailyReminder(settings, deals);
        retrySync();
      }
      appState.current = next;
    });
    return () => sub.remove();
  }, []);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      if (state.isConnected) {
        retrySync();
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!dataReady) return;
    const { settings } = useSettingsStore.getState();
    const { deals } = useDealsStore.getState();
    syncDailyReminder(settings, deals);
  }, [dataReady]);

  if (!fontsLoaded || !dataReady) {
    return null;
  }

  return (
    <ThemeProvider value={navigationTheme}>
      <StatusBar style="light" />
      <Stack screenOptions={{ contentStyle: { backgroundColor: colors.background } }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="add-deal" options={{ presentation: 'modal', headerShown: false }} />
      </Stack>
    </ThemeProvider>
  );
}
