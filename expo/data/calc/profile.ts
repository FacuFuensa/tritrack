// Campos del perfil de carrera ({value, source}) listos para mostrar.
import type { Field, Source } from '../types';

export interface FieldDisplay {
  /** Texto a mostrar; "sin dato" si value es null o falta el campo. */
  text: string;
  source: Source | null;
  /** true si hay que marcarlo como estimado. */
  estimated: boolean;
  missing: boolean;
}

export function fieldDisplay<T>(
  field: Field<T> | undefined | null,
  format: (v: T) => string = (v) => String(v),
): FieldDisplay {
  if (!field || field.value == null) {
    return { text: 'sin dato', source: field?.source ?? null, estimated: false, missing: true };
  }
  return {
    text: format(field.value),
    source: field.source,
    estimated: field.source === 'estimado',
    missing: false,
  };
}
