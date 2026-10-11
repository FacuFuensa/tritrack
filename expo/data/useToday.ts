// useToday (C5): lo que muestra la pestaña Hoy para una fecha (hoy por defecto).
// Nunca deja la pantalla vacía: sin semana, `missingWeek` es true; con una
// semana propuesta sin aceptar, `proposedWeek` trae el banner y las sesiones
// se ven igual.
import { useQuery } from '@tanstack/react-query';
import { api } from './api';
import { composeToday } from './calc/compose';
import { addDays, mondayOf, todayLocal } from './calc/dates';
import { keys } from './keys';
import type { TodayData } from './types';

export function useToday(date?: string) {
  const day = date ?? todayLocal();
  return useQuery<TodayData>({
    queryKey: keys.today(day),
    queryFn: async () => {
      const monday = mondayOf(day);
      // Dos semanas: la actual y la próxima (por si la propuesta es la que viene).
      const [block, weeks, sessions, activities, checkins, recovery, races] = await Promise.all([
        api.block(),
        api.weeks(),
        api.sessions({ from: monday, to: addDays(monday, 13) }),
        api.activities({ from: day, to: day }),
        api.checkins({ from: day, to: day }),
        api.recovery({ from: addDays(day, -6), to: day }),
        api.races(),
      ]);
      return composeToday(day, { block, weeks, sessions, activities, checkins, recovery, races });
    },
  });
}
