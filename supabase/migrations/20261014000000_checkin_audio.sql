-- Check-in por audio: Facu graba cómo se sintió en vez de tocar escalas. El
-- iPhone lo transcribe (dictado de Apple) y la app guarda el texto y el audio.
-- Un audio puede cubrir varias sesiones del mismo día: va una fila por sesión
-- con el mismo audio_path y la misma transcripción. El coach lee
-- transcripcion el domingo; rpe y energia quedan null si no se cargaron.

alter table checkins
  add column transcripcion text,
  add column audio_path text,   -- checkins-audio/<user_id>/<archivo>
  add column audio_s int check (audio_s >= 0);

grant insert (transcripcion, audio_path, audio_s) on checkins to authenticated;

-- Storage: audios en checkins-audio/<user_id>/..., privado
insert into storage.buckets (id, name, public)
values ('checkins-audio', 'checkins-audio', false)
on conflict (id) do nothing;

create policy checkins_audio_select on storage.objects for select to authenticated
  using (bucket_id = 'checkins-audio' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy checkins_audio_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'checkins-audio' and (storage.foldername(name))[1] = (select auth.uid())::text);
