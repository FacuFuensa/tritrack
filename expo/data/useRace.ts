// useRace (C5): una carrera. Comparte el cache de useRaces. `data` es null si
// no existe.
import { useQuery } from '@tanstack/react-query';
import { api } from './api';
import { keys } from './keys';
import type { Race } from './types';

export function useRace(id: string) {
  return useQuery<Race[], Error, Race | null>({
    queryKey: keys.races,
    queryFn: () => api.races(),
    select: (races) => races.find((r) => r.id === id) ?? null,
  });
}
