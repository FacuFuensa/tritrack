import { Stack, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useRef } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { TrainingProvider, useTraining } from "@/providers/TrainingProvider";
import { AuthProvider, useAuth } from "@/providers/AuthProvider";
import { registerPushToken, addNotificationResponseListener } from "@/utils/notifications";
import Colors from "@/constants/colors";
import { isSupabaseConfigured } from "@/data/supabase";
import { QueryProvider } from "@/data/QueryProvider";

// Sin EXPO_PUBLIC_SUPABASE_URL / ANON_KEY la app abre directo, sin login, y
// guarda todo en el teléfono (almacenamiento local de TrainingProvider).
const localOnly = !isSupabaseConfigured();

SplashScreen.preventAutoHideAsync();

function RootLayoutNav() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="login" options={{ headerShown: false, gestureEnabled: false }} />
      <Stack.Screen name="ajustes" options={{ headerShown: false, presentation: 'modal' }} />
      <Stack.Screen name="account" options={{ headerShown: false, presentation: 'modal' }} />
    </Stack>
  );
}

function AuthGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const segments = useSegments();
  const { isSignedIn, isLoading: authLoading, account } = useAuth();
  const { isLoading: trainingLoading } = useTraining();
  const pushRegisteredFor = useRef<string | null>(null);

  useEffect(() => {
    if (authLoading || trainingLoading) return;

    const currentSegment = segments[0] ?? '';
    console.log('[AuthGate] isSignedIn:', isSignedIn, 'segment:', currentSegment);

    if (!isSignedIn && !localOnly) {
      if (currentSegment !== 'login') {
        console.log('[AuthGate] Not signed in, redirecting to login');
        router.replace('/login' as never);
      }
      return;
    }

    if (currentSegment === 'login') {
      router.replace('/(tabs)/(home)' as never);
    }
  }, [isSignedIn, authLoading, trainingLoading, segments, router]);

  // Permiso de notificaciones y push token: recién con sesión iniciada (el
  // token se guarda a nombre del usuario). Sin backend no hay a quién avisar.
  const userId = account?.id ?? null;
  useEffect(() => {
    if (!isSignedIn || !userId || pushRegisteredFor.current === userId) return;
    pushRegisteredFor.current = userId;
    const timer = setTimeout(() => { void registerPushToken(userId); }, 1500);
    return () => clearTimeout(timer);
  }, [isSignedIn, userId]);

  useEffect(() => {
    const subscription = addNotificationResponseListener();
    return () => subscription.remove();
  }, []);

  if (authLoading || trainingLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.accent} />
      </View>
    );
  }

  return <>{children}</>;
}

export default function RootLayout() {
  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <QueryProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <AuthProvider>
          <TrainingProvider>
            <StatusBar style="light" />
            <AuthGate>
              <RootLayoutNav />
            </AuthGate>
          </TrainingProvider>
        </AuthProvider>
      </GestureHandlerRootView>
    </QueryProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    backgroundColor: Colors.background,
  },
});
