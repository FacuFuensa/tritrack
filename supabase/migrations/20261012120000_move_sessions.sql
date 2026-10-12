-- Mover sesiones de día: en Semana el usuario mantiene apretado un
-- entrenamiento y lo suelta en otro día. La app pasa a poder escribir
-- plan_sessions.date (además de status), y la fecha nueva tiene que caer
-- dentro de la misma semana del plan.

grant update (status, date) on plan_sessions to authenticated;

create or replace function plan_sessions_date_in_week() returns trigger
language plpgsql set search_path = public as $$
declare m date;
begin
  if new.date is distinct from old.date then
    select monday into m from plan_weeks where id = new.week_id;
    if m is not null and (new.date < m or new.date > m + 6) then
      raise exception 'La sesión tiene que quedar dentro de su semana';
    end if;
  end if;
  return new;
end $$;

drop trigger if exists plan_sessions_date_in_week on plan_sessions;
create trigger plan_sessions_date_in_week before update of date on plan_sessions
  for each row execute function plan_sessions_date_in_week();
