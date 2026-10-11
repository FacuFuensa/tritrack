// EXPO_PUBLIC_DATA_MODE=mock → todos los hooks leen de data/mocks/ y la app
// abre sin login. Cualquier otro valor (o nada) → Supabase.
export const DATA_MODE: 'mock' | 'live' =
  process.env.EXPO_PUBLIC_DATA_MODE === 'mock' ? 'mock' : 'live';
