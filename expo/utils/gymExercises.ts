// Variantes de ejercicios de gimnasio agrupadas por músculo, para cambiar
// rápido uno del plan por otro equivalente cuando en el gimnasio hacés otra
// cosa. Primero van los que ya hiciste; después, el resto del grupo.

export interface MuscleGroup { name: string; exercises: string[] }

export const MUSCLE_GROUPS: MuscleGroup[] = [
  { name: 'Cuádriceps', exercises: ['Sentadilla', 'Sentadilla búlgara', 'Sentadilla goblet', 'Sentadilla frontal', 'Prensa', 'Estocadas', 'Estocadas caminando', 'Estocadas hacia atrás', 'Subidas al cajón', 'Extensión de cuádriceps', 'Sentadilla con salto'] },
  { name: 'Isquios y glúteos', exercises: ['Peso muerto rumano', 'Peso muerto', 'Peso muerto a una pierna', 'Hip thrust', 'Puente de glúteo', 'Puente de glúteo a una pierna', 'Curl femoral', 'Buenos días', 'Nordic curl', 'Swing con pesa rusa'] },
  { name: 'Glúteo medio', exercises: ['Caminata lateral con banda', 'Abducción con banda', 'Abducción en máquina', 'Almeja con banda', 'Elevación lateral de pierna'] },
  { name: 'Gemelos', exercises: ['Elevación de talones', 'Elevación de talones a una pierna', 'Elevación de talones sentado', 'Saltos a la soga'] },
  { name: 'Core lateral', exercises: ['Plancha lateral', 'Plancha lateral con elevación de pierna', 'Pallof press', 'Caminata del granjero a un brazo', 'Rotación con polea'] },
  { name: 'Core', exercises: ['Plancha', 'Dead bug', 'Bird dog', 'Rueda abdominal', 'Hollow hold', 'Elevación de piernas colgado', 'Plancha con toque de hombro'] },
  { name: 'Espalda (remo)', exercises: ['Remo con mancuerna', 'Remo con barra', 'Remo en polea baja', 'Remo invertido', 'Remo en máquina', 'Remo con banda'] },
  { name: 'Espalda (dominada)', exercises: ['Dominadas', 'Dominadas asistidas', 'Jalón al pecho', 'Jalón con agarre neutro', 'Pullover en polea'] },
  { name: 'Pecho', exercises: ['Press de banca', 'Press con mancuernas', 'Press inclinado con mancuernas', 'Flexiones', 'Fondos', 'Aperturas con mancuernas'] },
  { name: 'Hombros', exercises: ['Press militar', 'Press de hombros con mancuernas', 'Elevaciones laterales', 'Face pull', 'Y-T-W en banco', 'Pájaros'] },
  { name: 'Brazos', exercises: ['Curl de bíceps', 'Curl martillo', 'Extensión de tríceps en polea', 'Press francés', 'Fondos en banco'] },
];

/** Minúsculas, sin tildes ni espacios de más: "Sentadilla Búlgara " = "sentadilla bulgara". */
export const normalize = (name: string) => name.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/\s+/g, ' ').trim();

/** El grupo de un ejercicio: por nombre exacto o, si no, por el más largo que contenga ("Sentadilla búlgara con mancuernas" → Cuádriceps). */
export function groupOf(name: string): MuscleGroup | null {
  const n = normalize(name);
  if (!n) return null;
  let best: { group: MuscleGroup; len: number } | null = null;
  for (const group of MUSCLE_GROUPS) {
    for (const ex of group.exercises) {
      const e = normalize(ex);
      if (e === n) return group;
      if (n.includes(e) && (!best || e.length > best.len)) best = { group, len: e.length };
    }
  }
  return best?.group ?? null;
}

/**
 * Opciones para cambiar `current`: `done` son los del mismo músculo que ya
 * hiciste (de `history`, el más reciente primero); `others`, el resto del
 * grupo. Si el plan decía otro (`planned`) y lo cambiaste, vuelve primero.
 */
export function alternativesFor(current: string, history: string[], planned?: string): { group: string | null; done: string[]; others: string[] } {
  const group = groupOf(planned ?? current) ?? groupOf(current);
  const seen = new Set([normalize(current)]);
  const take = (name: string) => { const n = normalize(name); if (!n || seen.has(n)) return false; seen.add(n); return true; };
  const done: string[] = [];
  if (planned && take(planned)) done.push(planned);
  for (const h of history) if (group && groupOf(h) === group && take(h)) done.push(h);
  const others = group ? group.exercises.filter(take) : [];
  return { group: group?.name ?? null, done, others };
}

/** Suma `name` al historial (el más reciente primero, sin repetir, hasta `max`). */
export function remember(history: string[], name: string, max = 200): string[] {
  const n = normalize(name);
  return [name.trim(), ...history.filter(h => normalize(h) !== n)].slice(0, max);
}
