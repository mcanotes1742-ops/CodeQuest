-- Reset a disqualified account so they can play again (testing only)
-- Example: reset by email
-- update public.game_sessions
-- set status = 'active', completed_at = null, final_time = null
-- where user_id = (select id from public.profiles where email = 'user@example.com');

-- Reset ALL disqualified sessions (careful!)
update public.game_sessions
set status = 'active',
    completed_at = null,
    final_time = null,
    last_heartbeat = now()
where status = 'disqualified';

select id, user_id, status from public.game_sessions;


update public.game_sessions
set status = 'active', completed_at = null, final_time = null
where user_id = (
  select id from public.profiles where email = 'hello@example.com'
);
