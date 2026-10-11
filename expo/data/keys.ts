// Claves de TanStack Query de la capa de datos. Las escrituras invalidan todo
// lo del plan: son pocas y así ninguna pantalla queda vieja.
export const keys = {
  today: (date: string) => ['today', date] as const,
  week: (monday: string) => ['week', monday] as const,
  weekHistory: (today: string) => ['weekHistory', today] as const,
  session: (id: string) => ['session', id] as const,
  races: ['races'] as const,
};
