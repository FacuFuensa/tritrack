// useSession (C5): una sesión con su prescripción, lo real de Strava y el
// check-in. `data` es null si la sesión no existe (por ejemplo, un deep link
// viejo a una semana que el coach reescribió).
import { useQuery } from '@tanstack/react-query';
import { api } from './api';
import { buildSessionViews } from './calc/session';
import { keys } from './keys';
import type { SessionView } from './types';

export function useSession(id: string) {
  return useQuery<SessionView | null>({
    queryKey: keys.session(id),
    queryFn: async () => {
      const s = await api.session(id);
      if (!s) return null;
      const day = { from: s.date, to: s.date };
      const [activities, checkins] = await Promise.all([api.activities(day), api.checkins(day)]);
      return buildSessionViews([s], activities, checkins)[0];
    },
    enabled: Boolean(id),
  });
}
