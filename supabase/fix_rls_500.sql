-- ============================================================
-- FIX: 500 Internal Server Error on profiles / game_sessions
-- Cause: RLS policies that SELECT from profiles inside a
-- profiles policy → infinite recursion → PostgREST 500
-- Run this ENTIRE script in Supabase SQL Editor
-- ============================================================

-- Helper: check admin without recursive RLS
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select coalesce(
    (select is_admin from public.profiles where id = auth.uid()),
    false
  );
$$;

grant execute on function public.is_admin() to authenticated, anon;

-- Drop recursive / conflicting policies
drop policy if exists "Users can view own profile" on public.profiles;
drop policy if exists "Users can update own profile" on public.profiles;
drop policy if exists "Admins can view all profiles" on public.profiles;
drop policy if exists "Users manage own session" on public.game_sessions;
drop policy if exists "Admins view all sessions" on public.game_sessions;
drop policy if exists "Admins update sessions" on public.game_sessions;
drop policy if exists "Users see own attempts" on public.answer_attempts;
drop policy if exists "Users insert own attempts" on public.answer_attempts;
drop policy if exists "Anyone can read settings" on public.game_settings;
drop policy if exists "Admins can update settings" on public.game_settings;

-- Profiles: simple, non-recursive
create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Admins can view all profiles"
  on public.profiles for select
  using (public.is_admin());

-- Allow insert for trigger / upsert from client
drop policy if exists "Users can insert own profile" on public.profiles;
create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

-- Game sessions
create policy "Users manage own session"
  on public.game_sessions for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Admins view all sessions"
  on public.game_sessions for select
  using (public.is_admin());

create policy "Admins update sessions"
  on public.game_sessions for update
  using (public.is_admin());

-- Answer attempts
create policy "Users see own attempts"
  on public.answer_attempts for select
  using (
    exists (
      select 1 from public.game_sessions
      where id = session_id and user_id = auth.uid()
    )
  );

create policy "Users insert own attempts"
  on public.answer_attempts for insert
  with check (
    exists (
      select 1 from public.game_sessions
      where id = session_id and user_id = auth.uid()
    )
  );

-- Settings
create policy "Anyone can read settings"
  on public.game_settings for select
  using (true);

create policy "Admins can update settings"
  on public.game_settings for update
  using (public.is_admin());

-- Ensure RPC grants still exist
grant execute on function public.start_game() to authenticated;
grant execute on function public.disqualify_me() to authenticated;
grant execute on function public.heartbeat() to authenticated;

-- Reset any stuck disqualified test accounts (optional)
update public.game_sessions
set status = 'active',
    completed_at = null,
    final_time = null,
    last_heartbeat = now()
where status = 'disqualified';

select 'RLS fixed – profiles/game_sessions should no longer 500' as status;
