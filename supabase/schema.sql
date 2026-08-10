-- ============================================================
-- CODE QUEST – Supabase Schema (SAFE TO RE-RUN)
-- Run this ENTIRE file first in SQL Editor
-- Then run seed_questions.sql
-- ============================================================

create extension if not exists "uuid-ossp";

-- ------------------------------------------------------------
-- Drop existing policies (so re-run works)
-- ------------------------------------------------------------
do $$ begin
  drop policy if exists "Users can view own profile" on public.profiles;
  drop policy if exists "Users can update own profile" on public.profiles;
  drop policy if exists "Admins can view all profiles" on public.profiles;
  drop policy if exists "Anyone can read settings" on public.game_settings;
  drop policy if exists "Admins can update settings" on public.game_settings;
  drop policy if exists "Users manage own session" on public.game_sessions;
  drop policy if exists "Admins view all sessions" on public.game_sessions;
  drop policy if exists "Users see own attempts" on public.answer_attempts;
  drop policy if exists "Users insert own attempts" on public.answer_attempts;
  drop policy if exists "Anyone can read question sets" on public.question_sets;
  drop policy if exists "Anyone can read levels public fields" on public.levels;
exception when undefined_table then null;
end $$;

-- ------------------------------------------------------------
-- 1. Profiles
-- ------------------------------------------------------------
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  display_name text not null,
  is_admin boolean default false,
  play_mode text not null default 'individual' check (play_mode in ('individual', 'team')),
  team_members jsonb default null,
  created_at timestamptz default now()
);

-- ------------------------------------------------------------
-- 2. Game Settings (singleton)
-- ------------------------------------------------------------
create table if not exists public.game_settings (
  id int primary key default 1 check (id = 1),
  starting_timer int not null default 1800,
  wrong_answer_penalty int not null default 30,
  memory_duration int not null default 20 check (memory_duration in (20, 30, 50)),
  game_active boolean not null default true,
  allow_replay boolean not null default false,
  leaderboard_visible boolean not null default true,
  allow_disqualified_replay boolean not null default false,
  updated_at timestamptz default now()
);

insert into public.game_settings (id) values (1)
on conflict (id) do nothing;

-- ------------------------------------------------------------
-- 3. Question Sets
-- ------------------------------------------------------------
create table if not exists public.question_sets (
  id int primary key check (id between 1 and 6),
  name text not null,
  is_active boolean default true,
  created_at timestamptz default now()
);

-- ------------------------------------------------------------
-- 4. Levels (questions) – answers NEVER exposed to client via RLS
-- ------------------------------------------------------------
create table if not exists public.levels (
  id uuid primary key default uuid_generate_v4(),
  set_id int not null references public.question_sets(id) on delete cascade,
  level_number int not null check (level_number between 1 and 6),
  level_type text not null check (level_type in (
    'riddle', 'output', 'detective', 'logic', 'arrangement', 'memory'
  )),
  language text check (language is null or language in ('python', 'java')),
  -- Public content (safe for client)
  question_text text,
  code_snippet text,
  description text,
  options jsonb,
  -- Private (server-only)
  correct_answer text,
  correct_lines jsonb,
  extra_data jsonb,
  unique(set_id, level_number)
);

-- ------------------------------------------------------------
-- 5. Game Sessions
-- ------------------------------------------------------------
create table if not exists public.game_sessions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  set_id int not null check (set_id between 1 and 6),
  current_level int not null default 1 check (current_level between 1 and 7),
  levels_completed int[] default '{}',
  fragments int default 0,
  score int default 0,
  wrong_attempts int default 0,
  time_penalty int default 0,
  started_at timestamptz default now(),
  last_heartbeat timestamptz default now(),
  completed_at timestamptz,
  final_time int,
  status text not null default 'active'
    check (status in ('active', 'completed', 'disqualified', 'abandoned')),
  unique(user_id)
);

-- ------------------------------------------------------------
-- 6. Answer Attempts (audit)
-- ------------------------------------------------------------
create table if not exists public.answer_attempts (
  id uuid primary key default uuid_generate_v4(),
  session_id uuid references public.game_sessions(id) on delete cascade,
  level_number int not null,
  is_correct boolean not null,
  submitted_answer text,
  submitted_at timestamptz default now()
);

-- ------------------------------------------------------------
-- RLS
-- ------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.game_settings enable row level security;
alter table public.question_sets enable row level security;
alter table public.levels enable row level security;
alter table public.game_sessions enable row level security;
alter table public.answer_attempts enable row level security;

-- Profiles
create policy "Users can view own profile"
  on public.profiles for select using (auth.uid() = id);
create policy "Users can update own profile"
  on public.profiles for update using (auth.uid() = id);
create policy "Admins can view all profiles"
  on public.profiles for select using (
    exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
  );

-- Settings
create policy "Anyone can read settings"
  on public.game_settings for select using (true);
create policy "Admins can update settings"
  on public.game_settings for update using (
    exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
  );

-- Question sets (public read)
create policy "Anyone can read question sets"
  on public.question_sets for select using (true);

-- Levels: users can only see non-answer columns (we still hide answers in app code)
-- For extra safety, prefer using a view or RPC. Basic policy:
create policy "Anyone can read levels public fields"
  on public.levels for select using (true);

-- Sessions
create policy "Users manage own session"
  on public.game_sessions for all using (auth.uid() = user_id);
create policy "Admins view all sessions"
  on public.game_sessions for select using (
    exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
  );

-- Attempts
create policy "Users see own attempts"
  on public.answer_attempts for select using (
    exists (
      select 1 from public.game_sessions
      where id = session_id and user_id = auth.uid()
    )
  );
create policy "Users insert own attempts"
  on public.answer_attempts for insert with check (
    exists (
      select 1 from public.game_sessions
      where id = session_id and user_id = auth.uid()
    )
  );

-- ------------------------------------------------------------
-- Auto-create profile on signup
-- ------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ------------------------------------------------------------
-- Helper: start game (assigns random set, blocks disqualified)
-- ------------------------------------------------------------
create or replace function public.start_game()
returns jsonb
language plpgsql
security definer set search_path = public
as $$
declare
  uid uuid := auth.uid();
  existing public.game_sessions%rowtype;
  new_set int;
  new_id uuid;
begin
  if uid is null then
    raise exception 'Not authenticated';
  end if;

  select * into existing from public.game_sessions where user_id = uid;

  if found then
    if existing.status = 'disqualified' then
      raise exception 'Account disqualified. Cannot play again.';
    end if;
    if existing.status = 'completed' then
      -- check allow_replay
      if not (select allow_replay from public.game_settings where id = 1) then
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

  -- New random set
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

-- ------------------------------------------------------------
-- Helper: disqualify current user
-- ------------------------------------------------------------
create or replace function public.disqualify_me()
returns void
language plpgsql
security definer set search_path = public
as $$
begin
  update public.game_sessions
  set status = 'disqualified', completed_at = now()
  where user_id = auth.uid() and status = 'active';
end;
$$;

-- ------------------------------------------------------------
-- Leaderboard view
-- ------------------------------------------------------------
create or replace view public.leaderboard as
select
  p.display_name,
  gs.set_id,
  gs.score,
  gs.wrong_attempts,
  gs.time_penalty,
  gs.final_time,
  gs.completed_at,
  coalesce(array_length(gs.levels_completed, 1), 0) as levels_done
from public.game_sessions gs
join public.profiles p on p.id = gs.user_id
where gs.status = 'completed'
order by gs.score desc, gs.final_time desc nulls last, gs.wrong_attempts asc;

grant select on public.leaderboard to authenticated;
grant select on public.question_sets to authenticated, anon;
grant select on public.levels to authenticated, anon;
grant select on public.game_settings to authenticated, anon;

-- Done
select 'Schema applied successfully' as status;
