import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useRef } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { View, ActivityIndicator, StyleSheet, Platform } from "react-native";
import { TrainingProvider, useTraining } from "@/providers/TrainingProvider";
import { AuthProvider, useAuth } from "@/providers/AuthProvider";
import { requestNotificationPermission, addNotificationResponseListener } from "@/utils/notifications";
import Colors from "@/constants/colors";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function RootLayoutNav() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="login" options={{ headerShown: false, gestureEnabled: false }} />
      <Stack.Screen name="integrations" options={{ headerShown: false, presentation: 'modal' }} />
      <Stack.Screen name="account" options={{ headerShown: false, presentation: 'modal' }} />
    </Stack>
  );
}

function AuthGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const segments = useSegments();
  const { isSignedIn, isLoading: authLoading } = useAuth();
  const { isLoading: trainingLoading } = useTraining();
  const notificationPermissionRequested = useRef(false);

  useEffect(() => {
    if (authLoading || trainingLoading) return;

    const currentSegment = segments[0] ?? '';
    console.log('[AuthGate] isSignedIn:', isSignedIn, 'segment:', currentSegment);

    if (!isSignedIn) {
      if (currentSegment !== 'login') {
        console.log('[AuthGate] Not signed in, redirecting to login');
        router.replace('/login' as never);
      }
      return;
    }

    if (currentSegment === 'login') {
      router.replace('/(tabs)/(home)' as never);
    }
  }, [isSignedIn, authLoading, trainingLoading, segments]);

  useEffect(() => {
    if (!isSignedIn || notificationPermissionRequested.current) return;
    notificationPermissionRequested.current = true;

    const timer = setTimeout(() => {
      console.log('[AuthGate] Requesting notification permission...');
      requestNotificationPermission().then((granted) => {
        console.log('[AuthGate] Notification permission:', granted ? 'granted' : 'denied');
      });
    }, 1500);

    return () => clearTimeout(timer);
  }, [isSignedIn]);

  useEffect(() => {
    if (Platform.OS === 'web') return;

    const subscription = addNotificationResponseListener((response) => {
      const data = response.notification.request.content.data;
      console.log('[AuthGate] Notification tapped, data:', data);

      if (data?.type === 'activity_sync' && data?.screen) {
        router.push(data.screen as never);
      }
    });

    return () => {
      if (subscription && typeof subscription.remove === 'function') {
        subscription.remove();
      }
    };
  }, [router]);

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
    <QueryClientProvider client={queryClient}>
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
    </QueryClientProvider>
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
