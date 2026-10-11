// useTrophies (C5): récords por tipo de carrera y medallas. Los tramos
// suspendidos y las carreras sin tiempo no cuentan para récords.
import { useQuery } from '@tanstack/react-query';
import { api } from './api';
import { composeTrophies } from './calc/compose';
import { keys } from './keys';
import type { Race, TrophiesData } from './types';

export function useTrophies() {
  return useQuery<Race[], Error, TrophiesData>({
    queryKey: keys.races,
    queryFn: () => api.races(),
    select: composeTrophies,
  });
}
