import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from "@expo-google-fonts/inter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack, router } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect, useState, useRef } from "react";
import { AppState, AppStateStatus, Platform, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { ErrorBoundary } from "@/components/ErrorBoundary";
import { LockScreen } from "@/components/LockScreen";
import { PrivacyOverlay } from "@/components/PrivacyOverlay";
import { PrivacyConsentModal } from "@/components/PrivacyConsentModal";
import { SettingsProvider, useSettings } from "@/contexts/SettingsContext";
import PrivacyPolicyScreen from "@/app/privacy-policy";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 2, staleTime: 30000 },
  },
});

function getTimeoutMs(timeout: string): number {
  switch (timeout) {
    case "immediate": return 0;
    case "1min": return 60_000;
    case "5min": return 300_000;
    case "15min": return 900_000;
    case "never": return Infinity;
    default: return 0;
  }
}

function AppGate({ children }: { children: React.ReactNode }) {
  const { settings, updateSetting, isLoaded } = useSettings();
  const [isLocked, setIsLocked] = useState(false);
  const [showOverlay, setShowOverlay] = useState(false);
  const [showConsent, setShowConsent] = useState(false);
  const [showPolicyFromConsent, setShowPolicyFromConsent] = useState(false);
  const backgroundedAt = useRef<number | null>(null);

  useEffect(() => {
    if (!isLoaded) return;
    if (!settings.privacyAccepted) {
      setShowConsent(true);
    }
    if (settings.appLockEnabled && Platform.OS !== "web") {
      setIsLocked(true);
    }
  }, [isLoaded]);

  useEffect(() => {
    if (Platform.OS === "web") return;

    const sub = AppState.addEventListener("change", (nextState: AppStateStatus) => {
      if (nextState === "active") {
        setShowOverlay(false);

        if (settings.appLockEnabled && backgroundedAt.current !== null) {
          const elapsed = Date.now() - backgroundedAt.current;
          const timeoutMs = getTimeoutMs(settings.autoLockTimeout);
          if (elapsed >= timeoutMs) {
            setIsLocked(true);
          }
        }
        backgroundedAt.current = null;
      } else if (nextState === "background" || nextState === "inactive") {
        setShowOverlay(true);
        if (backgroundedAt.current === null) {
          backgroundedAt.current = Date.now();
        }
      }
    });

    return () => sub.remove();
  }, [settings.appLockEnabled, settings.autoLockTimeout]);

  if (!isLoaded) return null;

  if (showPolicyFromConsent) {
    return <PrivacyPolicyScreen onBack={() => setShowPolicyFromConsent(false)} />;
  }

  if (showConsent) {
    return (
      <PrivacyConsentModal
        onAccept={() => {
          updateSetting("privacyAccepted", true);
          updateSetting("privacyAcceptedAt", new Date().toISOString());
          setShowConsent(false);
        }}
        onViewPolicy={() => {
          setShowPolicyFromConsent(true);
        }}
      />
    );
  }

  if (isLocked) {
    return <LockScreen onUnlock={() => setIsLocked(false)} />;
  }

  return (
    <View style={{ flex: 1 }}>
      {children}
      {showOverlay && <PrivacyOverlay />}
    </View>
  );
}

function RootLayoutNav() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="log-glucose" options={{ presentation: "modal", headerShown: false }} />
      <Stack.Screen name="log-medication" options={{ presentation: "modal", headerShown: false }} />
      <Stack.Screen name="log-meal" options={{ presentation: "modal", headerShown: false }} />
      <Stack.Screen name="manage-medications" options={{ presentation: "modal", headerShown: false }} />
      <Stack.Screen name="settings" options={{ presentation: "modal", headerShown: false }} />
      <Stack.Screen name="privacy-policy" options={{ presentation: "modal", headerShown: false }} />
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) SplashScreen.hideAsync();
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <SettingsProvider>
          <QueryClientProvider client={queryClient}>
            <GestureHandlerRootView style={{ flex: 1 }}>
              <KeyboardProvider>
                <AppGate>
                  <RootLayoutNav />
                </AppGate>
              </KeyboardProvider>
            </GestureHandlerRootView>
          </QueryClientProvider>
        </SettingsProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
