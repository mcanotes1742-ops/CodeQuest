-- ============================================================
-- MIGRATION: Admin controls + play mode support
-- Run this AFTER schema.sql (safe to re-run)
-- ============================================================

-- Add allow_disqualified_replay to game_settings
alter table public.game_settings
  add column if not exists allow_disqualified_replay boolean not null default false;

-- Add play mode + team members to profiles
alter table public.profiles
  add column if not exists play_mode text not null default 'individual'
    check (play_mode in ('individual', 'team'));

alter table public.profiles
  add column if not exists team_members jsonb default null;
  -- team_members example: [{"name":"A","email":"a@x.com"},{"name":"B","email":"b@x.com"}]

-- Ensure settings row exists
insert into public.game_settings (id) values (1)
on conflict (id) do nothing;

-- Update the start_game function to respect allow_disqualified_replay
create or replace function public.start_game()
returns jsonb
language plpgsql
security definer set search_path = public
as $$
declare
  uid uuid := auth.uid();
  existing public.game_sessions%rowtype;
  settings_row public.game_settings%rowtype;
  new_set int;
  new_id uuid;
begin
  if uid is null then
    raise exception 'Not authenticated';
  end if;

  select * into settings_row from public.game_settings where id = 1;
  select * into existing from public.game_sessions where user_id = uid;

  if found then
    if existing.status = 'disqualified' then
      if not coalesce(settings_row.allow_disqualified_replay, false) then
        raise exception 'Account disqualified. Cannot play again.';
      end if;
      -- Admin allowed replay: reset session
      update public.game_sessions set
        current_level = 1,
        levels_completed = '{}',
        fragments = 0,
        score = 0,
        wrong_attempts = 0,
        time_penalty = 0,
        started_at = now(),
        status = 'active',
        completed_at = null,
        final_time = null,
        set_id = floor(random() * 6 + 1)::int
      where user_id = uid
      returning id, set_id into new_id, new_set;

      return jsonb_build_object(
        'session_id', new_id,
        'set_id', new_set,
        'current_level', 1,
        'status', 'active',
        'resumed', false,
        'reset_from_disqualified', true
      );
    end if;

    if existing.status = 'completed' then
      if not coalesce(settings_row.allow_replay, false) then
        raise exception 'Quest already completed. Replay not allowed.';
      end if;
    end if;

    if existing.status = 'active' then
      return jsonb_build_object(
        'session_id', existing.id,
        'set_id', existing.set_id,
        'current_level', existing.current_level,
        'status', existing.status,
        'resumed', true
      );
    end if;
  end if;

  new_set := floor(random() * 6 + 1)::int;

  insert into public.game_sessions (user_id, set_id)
  values (uid, new_set)
  on conflict (user_id) do update set
    set_id = excluded.set_id,
    current_level = 1,
    levels_completed = '{}',
    fragments = 0,
    score = 0,
    wrong_attempts = 0,
    time_penalty = 0,
    started_at = now(),
    status = 'active',
    completed_at = null,
    final_time = null
  returning id into new_id;

  return jsonb_build_object(
    'session_id', new_id,
    'set_id', new_set,
    'current_level', 1,
    'status', 'active',
    'resumed', false
  );
end;
$$;

select 'Migration applied: allow_disqualified_replay + play_mode' as status;
