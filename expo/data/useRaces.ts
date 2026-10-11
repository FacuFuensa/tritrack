// useRaces (C5): la temporada. Próximas (la más cercana primero) y pasadas
// (la última primero).
import { useQuery } from '@tanstack/react-query';
import { api } from './api';
import { composeRaces } from './calc/compose';
import { todayLocal } from './calc/dates';
import { keys } from './keys';
import type { Race, RacesData } from './types';

export function useRaces() {
  return useQuery<Race[], Error, RacesData>({
    queryKey: keys.races,
    queryFn: () => api.races(),
    select: (races) => composeRaces(races, todayLocal()),
  });
}
