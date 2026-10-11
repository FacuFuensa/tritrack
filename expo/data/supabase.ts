// Cliente único de Supabase. La sesión se guarda en AsyncStorage: se inicia
// sesión una vez y queda. Solo lleva la URL y la anon key (públicas).
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState, Platform } from 'react-native';
import type { Database } from './database.types';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

const hasCredentials = Boolean(supabaseUrl && supabaseAnonKey);

const NETWORK_RETRY_DELAY_MS = 450;

function getFetchUrl(input: string | URL | Request): string {
  if (typeof input === 'string') return input;
  if (typeof URL !== 'undefined' && input instanceof URL) return input.toString();
  if (typeof Request !== 'undefined' && input instanceof Request) return input.url;
  return String(input);
}

function createNetworkFailureResponse(error: unknown): Response {
  const message = error instanceof Error ? error.message : 'Network request failed';
  return new Response(
    JSON.stringify({
      error: 'network_request_failed',
      message,
    }),
    {
      status: 503,
      statusText: 'Service Unavailable',
      headers: { 'Content-Type': 'application/json' },
    }
  );
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const supabaseFetch: typeof fetch = async (input, init) => {
  const url = getFetchUrl(input);

  try {
    const response = await fetch(input, init);
    if (response.status !== 503) return response;

    console.warn('[Supabase] 503 response, retrying once:', url);
    await delay(NETWORK_RETRY_DELAY_MS);
    return await fetch(input, init);
  } catch (error) {
    console.warn('[Supabase] Network request failed after retry:', url, error);
    try {
      await delay(NETWORK_RETRY_DELAY_MS);
      return await fetch(input, init);
    } catch (retryError) {
      console.warn('[Supabase] Network retry failed, returning recoverable response:', url, retryError);
      return createNetworkFailureResponse(retryError);
    }
  }
};

if (!hasCredentials) {
  console.log('[Supabase] Sin credenciales: la app corre en modo local, sin login.');
}

const storageAdapter = {
  getItem: async (key: string): Promise<string | null> => {
    try {
      return await AsyncStorage.getItem(key);
    } catch (e) {
      console.error('[Supabase] Storage getItem error:', e);
      return null;
    }
  },
  setItem: async (key: string, value: string): Promise<void> => {
    try {
      await AsyncStorage.setItem(key, value);
    } catch (e) {
      console.error('[Supabase] Storage setItem error:', e);
    }
  },
  removeItem: async (key: string): Promise<void> => {
    try {
      await AsyncStorage.removeItem(key);
    } catch (e) {
      console.error('[Supabase] Storage removeItem error:', e);
    }
  },
};

const safeUrl = supabaseUrl || 'https://placeholder.supabase.co';
const safeKey = supabaseAnonKey || 'placeholder-key';

export const supabase: SupabaseClient<Database> = createClient<Database>(safeUrl, safeKey, {
  global: {
    fetch: supabaseFetch,
  },
  auth: {
    storage: storageAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: Platform.OS === 'web',
  },
});

// En segundo plano iOS congela los timers: el refresco del JWT se pausa y se
// retoma al volver, para no arrancar con un token vencido.
if (hasCredentials && Platform.OS !== 'web') {
  AppState.addEventListener('change', (state) => {
    if (state === 'active') supabase.auth.startAutoRefresh();
    else supabase.auth.stopAutoRefresh();
  });
}

export function isSupabaseConfigured(): boolean {
  return hasCredentials;
}
