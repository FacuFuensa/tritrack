// useWeek (C5): una semana del plan con sus sesiones, volumen plan vs hecho y
// % del tiempo bajo el techo de pulso. `monday` puede ser cualquier día de la
// semana; por defecto, la actual. Sin semana cargada, `week` es null y las
// sesiones (si las hubiera) igual se devuelven.
import { useQuery } from '@tanstack/react-query';
import { api } from './api';
import { composeWeek } from './calc/compose';
import { addDays, mondayOf, todayLocal } from './calc/dates';
import { keys } from './keys';
import type { WeekData } from './types';

export function useWeek(monday?: string) {
  const m = mondayOf(monday ?? todayLocal());
  return useQuery<WeekData>({
    queryKey: keys.week(m),
    queryFn: async () => {
      const range = { from: m, to: addDays(m, 6) };
      const [block, weeks, sessions, activities, checkins] = await Promise.all([
        api.block(), api.weeks(), api.sessions(range), api.activities(range), api.checkins(range),
      ]);
      return composeWeek(m, { block, weeks, sessions, activities, checkins });
    },
  });
}
