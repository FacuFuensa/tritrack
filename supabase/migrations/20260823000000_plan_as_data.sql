-- Fase 0: el plan de entrenamiento deja de ser código y pasa a ser datos.
-- Incluye tablas de fase 1 (WHOOP, activities) para poder sembrar credenciales
-- antes de que existan las Edge Functions que las usan.

-- ---------------------------------------------------------------------------
-- Plan
-- ---------------------------------------------------------------------------

create table if not exists plan_blocks (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  name         text not null,
  start_monday date not null,
  event_name   text,
  event_date   date,
  goal         text,
  active       boolean not null default true,
  created_at   timestamptz not null default now()
);

-- Un solo bloque activo por usuario: el resto de la app asume "el bloque".
create unique index if not exists plan_blocks_one_active
  on plan_blocks (user_id) where active;

create table if not exists plan_weeks (
  id           uuid primary key default gen_random_uuid(),
  block_id     uuid not null references plan_blocks(id) on delete cascade,
  user_id      uuid not null references auth.users(id) on delete cascade,
  week_index   int  not null,
  monday       date not null,
  kind         text not null check (kind in ('reset','build','peak','absorb','taper','race')),
  focus        text,
  targets      jsonb not null default '{}'::jsonb,
  coach_note   text,
  generated_by text not null default 'seed' check (generated_by in ('seed','coach','manual')),
  updated_at   timestamptz not null default now(),
  unique (block_id, week_index),
  unique (user_id, monday)
);

create table if not exists plan_sessions (
  id           uuid primary key default gen_random_uuid(),
  week_id      uuid not null references plan_weeks(id) on delete cascade,
  user_id      uuid not null references auth.users(id) on delete cascade,
  date         date not null,
  slot         text not null default 'AM' check (slot in ('AM','PM')),
  session_id   text not null,
  order_index  int  not null default 0,
  optional     boolean not null default false,
  overrides    jsonb,
  origin       text not null default 'seed' check (origin in ('seed','coach','manual')),
  updated_at   timestamptz not null default now(),
  unique (user_id, date, session_id)
);

create index if not exists plan_sessions_user_date on plan_sessions (user_id, date);

-- ---------------------------------------------------------------------------
-- Actividad completa
--
-- Arregla el gap de strava-sync, que hoy solo persiste las actividades que
-- matchean una sesión planificada: si hay dos bicis un sábado, la segunda
-- desaparece. El coach del domingo no puede opinar sobre una semana que ve
-- a medias.
-- ---------------------------------------------------------------------------

create table if not exists activities (
  user_id     uuid not null references auth.users(id) on delete cascade,
  source      text not null,
  external_id text not null,
  date        date not null,
  started_at  timestamptz,
  sport       text,
  discipline  text,
  distance_m  numeric,
  moving_s    int,
  elapsed_s   int,
  avg_hr      int,
  max_hr      int,
  avg_watts   numeric,
  elev_m      numeric,
  raw         jsonb,
  primary key (user_id, source, external_id)
);

create index if not exists activities_user_date on activities (user_id, date);

-- ---------------------------------------------------------------------------
-- WHOOP (fase 1 — las tablas se crean ya para poder sembrar credenciales)
-- ---------------------------------------------------------------------------

create table if not exists whoop_config (
  id            int primary key default 1 check (id = 1),
  client_id     text not null,
  client_secret text not null
);

create table if not exists whoop_tokens (
  user_id       uuid primary key references auth.users(id) on delete cascade,
  whoop_user_id text,
  access_token  text not null,
  refresh_token text not null,
  expires_at    bigint not null,
  scope         text,
  updated_at    timestamptz not null default now()
);

create table if not exists recovery_daily (
  user_id        uuid not null references auth.users(id) on delete cascade,
  date           date not null,
  recovery_pct   int,
  hrv_ms         numeric,
  rhr_bpm        int,
  sleep_perf_pct int,
  sleep_h        numeric,
  strain         numeric,
  source         text not null default 'whoop',
  primary key (user_id, date)
);

-- ---------------------------------------------------------------------------
-- RLS: cada quien ve solo lo suyo
-- ---------------------------------------------------------------------------

alter table plan_blocks     enable row level security;
alter table plan_weeks      enable row level security;
alter table plan_sessions   enable row level security;
alter table activities      enable row level security;
alter table whoop_tokens    enable row level security;
alter table recovery_daily  enable row level security;
alter table whoop_config    enable row level security;

do $$
declare t text;
begin
  foreach t in array array[
    'plan_blocks','plan_weeks','plan_sessions',
    'activities','whoop_tokens','recovery_daily'
  ] loop
    execute format('drop policy if exists %I on %I', t || '_own', t);
    execute format(
      'create policy %I on %I for all using (auth.uid() = user_id) with check (auth.uid() = user_id)',
      t || '_own', t);
  end loop;
end $$;

-- whoop_config no tiene user_id: es configuración de la app, no del usuario.
-- Queda con RLS activo y SIN ninguna política a propósito: en Postgres eso
-- significa "nadie pasa" para anon y authenticated. Solo la service_role, que
-- saltea RLS por diseño, la lee desde las Edge Functions. Es el mismo trato
-- que strava_config.
