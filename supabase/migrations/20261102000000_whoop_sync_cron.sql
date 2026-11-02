-- ---------------------------------------------------------------------------
-- Whoop se sincroniza solo, dos veces por día
-- ---------------------------------------------------------------------------
-- WHOOP no tiene webhook y whoop-sync solo corría cuando la app lo pedía
-- (Ajustes → Sincronizar ahora, o al conectar). Si nadie abría la app,
-- recovery_daily se quedaba sin filas y el coach no armaba la semana.
--
-- 13:00 UTC = 8:00 en Texas en invierno (7:00 en verano): la recuperación de
-- la mañana ya está. 19:00 UTC = 14:00 (13:00): agarra a los que se despiertan
-- tarde y el strain de la mañana. whoop-sync trae siempre los últimos 30 días,
-- así que un día que falle lo rellena el siguiente.
--
-- La clave se lee de push_config en cada corrida, igual que los recordatorios:
-- nada de secretos en el repo.

create extension if not exists pg_cron;
create extension if not exists pg_net;

-- cron.schedule con nombre reemplaza el job si ya existe: la migración se
-- puede volver a correr.
select cron.schedule(
  'whoop-sync-diario',
  '0 13,19 * * *',
  $$
  select net.http_post(
    url := 'https://ufxkutmjhivtiqewitrt.supabase.co/functions/v1/whoop-sync',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-tc-key', (select shared_key from public.push_config limit 1)
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 60000
  );
  $$
);
