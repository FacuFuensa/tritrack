-- Prompt 3: tablas del coach (contrato C3), bucket de medallas, permisos de la
-- app según "Quién escribe qué" (spec §4) y trigger de "semana lista".
--
-- Permisos: el coach (conector) y las Edge Functions usan service role y
-- saltean RLS. La app (anon/authenticated + JWT) solo puede leer lo suyo y
-- escribir las columnas que le tocan. Eso se hace con GRANT por columna, que
-- Postgres hace cumplir antes que RLS: un UPDATE de `prescription` desde la
-- app falla con "permission denied", tenga la policy que tenga.

-- ---------------------------------------------------------------------------
-- Columnas nuevas
-- ---------------------------------------------------------------------------

alter table plan_weeks
  add column status text not null default 'accepted'
    check (status in ('proposed','accepted','changes_requested')),
  add column briefing_md text,
  add column feedback text;

alter table plan_sessions
  add column title text,
  add column discipline text check (discipline in ('swim','bike','run','brick','gym','rest')),
  add column prescription jsonb not null default '{}',
  add column status text not null default 'planned'
    check (status in ('planned','done','skipped')),
  add column activity_id text;                  -- activities.external_id

create table races (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  name text not null, date date not null, location text,
  kind text not null check (kind in ('run_5k','run_10k','run_21k','run_42k',
        'tri_sprint','tri_olympic','tri_703','tri_full','other')),
  priority text check (priority in ('A','B','C')),
  status text not null default 'planned'
    check (status in ('planned','registered','done','dns')),
  start_local time,
  logistics jsonb not null default '{}',
  profile jsonb not null default '{}',
  climate jsonb not null default '{}',
  strategy_md text,
  result jsonb,
  medal_path text,                              -- Storage: bucket "medallas"
  activity_ids text[] not null default '{}',
  created_at timestamptz not null default now()
);
create index races_user_date on races (user_id, date);

alter table plan_blocks add column race_id uuid references races on delete set null;
create index plan_blocks_race on plan_blocks (race_id);

create table checkins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  date date not null,
  session_id uuid references plan_sessions on delete set null,
  activity_id text,
  rpe int check (rpe between 1 and 10),
  energia int check (energia between 1 and 5),
  molestia jsonb,                               -- {zona: text, nivel: 0..3}
  nutricion jsonb,                              -- {geles?: int, liquido_ml?: int}
  nota text,
  created_at timestamptz not null default now()
);
create index checkins_user_date on checkins (user_id, date);
create index checkins_session on checkins (session_id);

-- ---------------------------------------------------------------------------
-- Permisos de la app
-- ---------------------------------------------------------------------------

-- anon nunca escribe nada de esto.
revoke insert, update, delete, truncate on plan_weeks, plan_sessions, races, checkins from anon;
revoke insert, update, delete, truncate on plan_weeks, plan_sessions, races, checkins from authenticated;

grant select on plan_weeks, plan_sessions, races, checkins to authenticated;
grant update (status, feedback) on plan_weeks to authenticated;
grant update (status) on plan_sessions to authenticated;
grant update (status, medal_path, result) on races to authenticated;
grant insert (user_id, date, session_id, activity_id, rpe, energia, molestia, nutricion, nota)
  on checkins to authenticated;

-- Las policies "_own" for all de fase 0 se reemplazan por leer + actualizar.
drop policy if exists plan_weeks_own on plan_weeks;
drop policy if exists plan_sessions_own on plan_sessions;

create policy plan_weeks_select on plan_weeks for select
  using ((select auth.uid()) = user_id);
create policy plan_weeks_update on plan_weeks for update
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

create policy plan_sessions_select on plan_sessions for select
  using ((select auth.uid()) = user_id);
create policy plan_sessions_update on plan_sessions for update
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

alter table races enable row level security;
create policy races_select on races for select
  using ((select auth.uid()) = user_id);
-- La app marca 'registered' o 'done' (resultado manual); 'dns' y 'planned'
-- son del coach.
create policy races_update on races for update
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id and status in ('registered','done'));

alter table checkins enable row level security;
create policy checkins_select on checkins for select
  using ((select auth.uid()) = user_id);
create policy checkins_insert on checkins for insert
  with check ((select auth.uid()) = user_id);

-- ---------------------------------------------------------------------------
-- Storage: medallas en <user_id>/<race_id>.png, privado
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public)
values ('medallas', 'medallas', false)
on conflict (id) do nothing;

create policy medallas_select on storage.objects for select to authenticated
  using (bucket_id = 'medallas' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy medallas_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'medallas' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy medallas_update on storage.objects for update to authenticated
  using (bucket_id = 'medallas' and (storage.foldername(name))[1] = (select auth.uid())::text)
  with check (bucket_id = 'medallas' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy medallas_delete on storage.objects for delete to authenticated
  using (bucket_id = 'medallas' and (storage.foldername(name))[1] = (select auth.uid())::text);

-- ---------------------------------------------------------------------------
-- Trigger: "Tu semana está lista"
-- ---------------------------------------------------------------------------

create or replace function public.notify_week_ready()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  secret text;
  first_line text;
begin
  if new.status <> 'proposed' then return new; end if;
  if tg_op = 'UPDATE' and old.status = 'proposed' then return new; end if;

  select decrypted_secret into secret from vault.decrypted_secrets where name = 'notify_secret';
  if secret is null then return new; end if;

  first_line := nullif(btrim(split_part(coalesce(new.briefing_md, ''), E'\n', 1), ' #*'), '');

  perform net.http_post(
    url := 'https://ufxkutmjhivtiqewitrt.supabase.co/functions/v1/notify',
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-notify-secret', secret),
    body := jsonb_build_object(
      'user_id', new.user_id,
      'title', 'Tu semana está lista',
      'body', coalesce(first_line, 'Abrí Semana para verla.'),
      'url', 'tritrack://semana'
    )
  );
  return new;
end;
$$;

revoke execute on function public.notify_week_ready() from public, anon, authenticated;

create trigger plan_weeks_notify_ready
  after insert or update of status on plan_weeks
  for each row execute function public.notify_week_ready();
