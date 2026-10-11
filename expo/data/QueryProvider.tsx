// TanStack Query con el cache persistido en AsyncStorage: sin conexión, la
// app abre mostrando lo último que cargó (Foco de revisión, punto 4).
import React from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { QueryClient } from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // gcTime >= maxAge del persister: si no, lo persistido se descarta antes.
      gcTime: WEEK_MS,
      staleTime: 60_000,
      retry: 1,
    },
  },
});

const persister = createAsyncStoragePersister({
  storage: AsyncStorage,
  key: 'tritrack-query-cache',
  throttleTime: 1000,
});

export function QueryProvider({ children }: { children: React.ReactNode }) {
  return (
    <PersistQueryClientProvider
      client={queryClient}
      // `buster` invalida el cache guardado cuando cambia la forma de los datos.
      persistOptions={{ persister, maxAge: WEEK_MS, buster: 'v1' }}
    >
      {children}
    </PersistQueryClientProvider>
  );
}
