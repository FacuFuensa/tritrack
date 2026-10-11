import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import * as Linking from 'expo-linking';
import { Platform } from 'react-native';
import { supabase } from '@/data/supabase';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

// Pide permiso (una vez: iOS no vuelve a preguntar), saca el Expo push token
// del proyecto EAS y lo guarda en push_tokens. Se llama después del login,
// nunca al abrir la app por primera vez. Devuelve el token o null.
export async function registerPushToken(userId: string): Promise<string | null> {
  if (Platform.OS === 'web') return null;

  try {
    let { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted') {
      ({ status } = await Notifications.requestPermissionsAsync());
    }
    if (status !== 'granted') {
      console.log('[Notifications] Permiso denegado');
      return null;
    }

    const projectId = Constants.expoConfig?.extra?.eas?.projectId as string | undefined;
    const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId });

    const { error } = await supabase.from('push_tokens').upsert(
      { user_id: userId, expo_token: token, platform: Platform.OS, updated_at: new Date().toISOString() },
      { onConflict: 'user_id,expo_token' },
    );
    if (error) console.warn('[Notifications] No se pudo guardar el token:', error.message);
    return token;
  } catch (err) {
    // En el simulador o sin la clave push de Apple no hay token: la app sigue.
    console.warn('[Notifications] Sin push token:', err);
    return null;
  }
}

export async function getNotificationPermissionStatus(): Promise<string> {
  if (Platform.OS === 'web') return 'unsupported';
  try {
    const { status } = await Notifications.getPermissionsAsync();
    return status;
  } catch {
    return 'unknown';
  }
}

// Las notificaciones del servidor traen data.url con un deep link
// tritrack://... (contrato C1). Tocar la notificación lo abre.
export function addNotificationResponseListener() {
  if (Platform.OS === 'web') return { remove: () => {} };
  return Notifications.addNotificationResponseReceivedListener((response) => {
    const url = response.notification.request.content.data?.url;
    if (typeof url === 'string' && url.startsWith('tritrack://')) {
      Linking.openURL(url).catch(() => {});
    }
  });
}
