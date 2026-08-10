-- ============================================================
-- Proper disqualification system
-- Run in Supabase SQL Editor after schema.sql
-- ============================================================

alter table public.game_sessions
  add column if not exists dq_reason text,
  add column if not exists dq_at timestamptz;

-- Disqualify current user with a reason (security definer)
create or replace function public.disqualify_me(p_reason text default 'anti-cheat')
returns void
language plpgsql
security definer set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  update public.game_sessions
  set status = 'disqualified',
      completed_at = now(),
      dq_reason = left(coalesce(p_reason, 'anti-cheat'), 200),
      dq_at = now(),
      last_heartbeat = now()
  where user_id = auth.uid()
    and status = 'active';
end;
$$;

grant execute on function public.disqualify_me(text) to authenticated;
-- keep zero-arg version working
create or replace function public.disqualify_me()
returns void
language plpgsql
security definer set search_path = public
as $$
begin
  perform public.disqualify_me('anti-cheat');
end;
$$;

grant execute on function public.disqualify_me() to authenticated;

select 'Disqualify system ready' as status;


