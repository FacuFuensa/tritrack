// useWeekHistory (C5): semanas anteriores a la actual, la más reciente primero,
// con su briefing y cuántas sesiones se hicieron.
import { useQuery } from '@tanstack/react-query';
import { api } from './api';
import { composeHistory } from './calc/compose';
import { addDays, mondayOf, todayLocal } from './calc/dates';
import { keys } from './keys';
import type { WeekSummary } from './types';

export function useWeekHistory() {
  const today = todayLocal();
  return useQuery<WeekSummary[]>({
    queryKey: keys.weekHistory(today),
    queryFn: async () => {
      const [block, weeks, sessions] = await Promise.all([
        api.block(), api.weeks(),
        api.sessions({ from: '1970-01-01', to: addDays(mondayOf(today), -1) }),
      ]);
      return composeHistory(today, { block, weeks, sessions });
    },
  });
}
