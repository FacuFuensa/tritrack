// useConnections (contrato C5): estado de Strava y Whoop, y las acciones de
// Ajustes. El OAuth lo hace la función `oauth`: la app solo abre la URL que
// le devuelve y lee el deep link de vuelta.
import { useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { supabase } from './supabase';
import { callFunction, FunctionError } from './functions';

export type Provider = 'strava' | 'whoop';
export type Conn = { status: 'connected' | 'disconnected' | 'error'; lastSyncAt: string | null };

export const CONNECTIONS_KEY = ['connections'] as const;

// Misma marca que supabase/functions/_shared/connection.ts: el sync la pone
// en `scope` cuando el refresh token murió.
const REAUTH_PREFIX = 'reauth:';

const PROVIDER_NAME: Record<Provider, string> = { strava: 'Strava', whoop: 'WHOOP' };

export function toConn(row: { scope: string | null; updated_at: string } | null): Conn {
  if (!row) return { status: 'disconnected', lastSyncAt: null };
  return {
    status: (row.scope ?? '').startsWith(REAUTH_PREFIX) ? 'error' : 'connected',
    // updated_at lo tocan el OAuth y cada sincronización que termina bien.
    lastSyncAt: row.updated_at,
  };
}

// Solo scope y updated_at: los tokens nunca viajan al teléfono.
async function fetchConnections(): Promise<Record<Provider, Conn>> {
  const [strava, whoop] = await Promise.all([
    supabase.from('strava_tokens').select('scope, updated_at').maybeSingle(),
    supabase.from('whoop_tokens').select('scope, updated_at').maybeSingle(),
  ]);
  if (strava.error) throw strava.error;
  if (whoop.error) throw whoop.error;
  return { strava: toConn(strava.data), whoop: toConn(whoop.data) };
}

const OAUTH_ERRORS: Record<string, string> = {
  denied: 'Cancelaste la autorización.',
  state_expired: 'Pasaron más de 10 minutos. Probá de nuevo.',
  state_not_found: 'El pedido de conexión ya no vale. Probá de nuevo.',
  state_mismatch: 'El pedido de conexión no coincide. Probá de nuevo.',
  token_exchange: 'rechazó el código de autorización. Probá de nuevo.',
};

function oauthMessage(p: Provider, code: string | undefined): string {
  const msg = code ? OAUTH_ERRORS[code] : undefined;
  if (code === 'token_exchange') return `${PROVIDER_NAME[p]} ${msg}`;
  return msg ?? `No se pudo conectar ${PROVIDER_NAME[p]}${code ? ` (${code})` : ''}.`;
}

export function syncErrorMessage(p: Provider, e: unknown): string {
  if (e instanceof FunctionError) {
    if (e.code === 'reauth') return `La conexión con ${PROVIDER_NAME[p]} se cortó. Tocá Reconectar.`;
    if (e.code === 'network') return 'Sin conexión. Probá de nuevo en un rato.';
    if (e.code === 'not connected') return `${PROVIDER_NAME[p]} no está conectado.`;
  }
  return `No se pudo sincronizar ${PROVIDER_NAME[p]}.`;
}

const DISCONNECTED: Conn = { status: 'disconnected', lastSyncAt: null };

export function useConnections() {
  const qc = useQueryClient();
  const query = useQuery({ queryKey: CONNECTIONS_KEY, queryFn: fetchConnections });

  const refreshAll = useCallback(async () => {
    // Una sincronización trae datos nuevos para todas las pantallas.
    await qc.invalidateQueries();
  }, [qc]);

  // Strava acepta {days}; whoop-sync trae siempre sus 30 días.
  const syncNow = useCallback(async (p: Provider, days?: number) => {
    try {
      await callFunction(`${p}-sync`, p === 'strava' ? { days: days ?? 14 } : {});
    } catch (e) {
      throw new Error(syncErrorMessage(p, e));
    } finally {
      await refreshAll();
    }
  }, [refreshAll]);

  // Devuelve false si el usuario cerró la ventana sin terminar.
  const connect = useCallback(async (p: Provider): Promise<boolean> => {
    let url: string;
    try {
      ({ url } = await callFunction<{ url: string }>('oauth/start', { provider: p }));
    } catch (e) {
      throw new Error(e instanceof FunctionError && e.code === 'network'
        ? 'Sin conexión. Probá de nuevo en un rato.'
        : `No se pudo iniciar la conexión con ${PROVIDER_NAME[p]}.`);
    }

    const result = await WebBrowser.openAuthSessionAsync(url, 'tritrack://oauth');
    if (result.type !== 'success') return false;

    const { queryParams } = Linking.parse(result.url);
    if (queryParams?.ok !== '1') {
      await qc.invalidateQueries({ queryKey: CONNECTIONS_KEY });
      throw new Error(oauthMessage(p, queryParams?.error as string | undefined));
    }

    await qc.invalidateQueries({ queryKey: CONNECTIONS_KEY });
    // Primera sincronización: de Strava, los últimos 90 días (backfill). Si
    // falla, la conexión igual quedó hecha; se reintenta con "Sincronizar ahora".
    await syncNow(p, p === 'strava' ? 90 : undefined).catch(() => {});
    return true;
  }, [qc, syncNow]);

  const disconnect = useCallback(async (p: Provider) => {
    try {
      await callFunction('oauth/disconnect', { provider: p });
    } finally {
      await qc.invalidateQueries({ queryKey: CONNECTIONS_KEY });
    }
  }, [qc]);

  return {
    strava: query.data?.strava ?? DISCONNECTED,
    whoop: query.data?.whoop ?? DISCONNECTED,
    connect,
    disconnect,
    syncNow,
    data: query.data,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}
