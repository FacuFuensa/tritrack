// Llamadas a las Edge Functions con el JWT de la sesión. Los errores salen
// con el status HTTP y el código corto que devuelve la función ({error}).
import { FunctionsHttpError } from '@supabase/supabase-js';
import { supabase } from './supabase';

export class FunctionError extends Error {
  constructor(public code: string, public status?: number) {
    super(code);
    this.name = 'FunctionError';
  }
}

// `name` puede llevar ruta: 'oauth/start' → /functions/v1/oauth/start.
export async function callFunction<T>(name: string, body: object = {}): Promise<T> {
  const { data, error } = await supabase.functions.invoke(name, { body });
  if (!error) return data as T;

  if (error instanceof FunctionsHttpError) {
    const res = error.context as Response;
    let code = `http_${res.status}`;
    try {
      const j = await res.json();
      if (typeof j?.error === 'string') code = j.error;
    } catch { /* cuerpo no JSON */ }
    throw new FunctionError(code, res.status);
  }
  // Sin red o la función no respondió.
  throw new FunctionError('network');
}
