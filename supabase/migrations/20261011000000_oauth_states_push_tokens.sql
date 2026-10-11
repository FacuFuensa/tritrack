-- Prompt 2: estado del OAuth hecho en el servidor y tokens de Expo Push.
-- Contrato C3 del plan TriTrack + Coach.

-- Nonce que viaja en `state` del OAuth: ata el callback (que llega sin sesión,
-- desde el navegador del proveedor) al usuario que pidió conectar. Vence a los
-- 10 minutos; lo valida y lo borra la función `oauth`.
create table oauth_states (
  nonce      text primary key check (nonce ~ '^[0-9a-f]{32}$'),
  user_id    uuid not null references auth.users on delete cascade,
  provider   text not null check (provider in ('strava','whoop')),
  created_at timestamptz not null default now()
);

-- Solo service role: RLS prendido y ninguna policy.
alter table oauth_states enable row level security;

create table push_tokens (
  user_id    uuid not null references auth.users on delete cascade,
  expo_token text not null,
  platform   text not null default 'ios',
  updated_at timestamptz not null default now(),
  primary key (user_id, expo_token)
);

alter table push_tokens enable row level security;

create policy push_tokens_own on push_tokens
  for all
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
