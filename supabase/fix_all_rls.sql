-- ============================================================
-- FIX: infinite recursion on profiles + clean RLS
-- Run this ENTIRE script once in SQL Editor
-- ============================================================

-- Helper: check admin WITHOUT triggering RLS recursion
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT COALESCE(
    (SELECT is_admin FROM public.profiles WHERE id = auth.uid() LIMIT 1),
    false
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated, anon, service_role;

-- ------------------------------------------------------------
-- Drop ALL old policies (avoids recursion / conflicts)
-- ------------------------------------------------------------
DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT policyname, tablename
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename IN (
        'profiles','game_sessions','game_settings',
        'question_sets','levels','answer_attempts'
      )
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', r.policyname, r.tablename);
  END LOOP;
END $$;

-- ------------------------------------------------------------
-- PROFILES
-- ------------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_select_own"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id OR public.is_admin());

CREATE POLICY "profiles_update_own"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_insert_own"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- ------------------------------------------------------------
-- GAME SESSIONS
-- ------------------------------------------------------------
ALTER TABLE public.game_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sessions_all_own"
  ON public.game_sessions FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "sessions_admin_select"
  ON public.game_sessions FOR SELECT
  USING (public.is_admin());

-- ------------------------------------------------------------
-- GAME SETTINGS
-- ------------------------------------------------------------
ALTER TABLE public.game_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "settings_read_all"
  ON public.game_settings FOR SELECT
  USING (true);

CREATE POLICY "settings_admin_update"
  ON public.game_settings FOR UPDATE
  USING (public.is_admin());

-- ------------------------------------------------------------
-- QUESTION SETS / LEVELS (read-only for everyone)
-- ------------------------------------------------------------
ALTER TABLE public.question_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.levels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sets_read" ON public.question_sets FOR SELECT USING (true);
CREATE POLICY "levels_read" ON public.levels FOR SELECT USING (true);

-- ------------------------------------------------------------
-- ANSWER ATTEMPTS
-- ------------------------------------------------------------
ALTER TABLE public.answer_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "attempts_select_own"
  ON public.answer_attempts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.game_sessions gs
      WHERE gs.id = session_id AND gs.user_id = auth.uid()
    )
    OR public.is_admin()
  );

CREATE POLICY "attempts_insert_own"
  ON public.answer_attempts FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.game_sessions gs
      WHERE gs.id = session_id AND gs.user_id = auth.uid()
    )
  );

-- ------------------------------------------------------------
-- Grants
-- ------------------------------------------------------------
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role, postgres;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT SELECT ON public.game_settings, public.question_sets, public.levels TO anon;
GRANT EXECUTE ON FUNCTION public.start_game() TO authenticated;
GRANT EXECUTE ON FUNCTION public.disqualify_me() TO authenticated;

-- start_game: disqualified = NEW random set only if admin allows (never resume mid-level)
CREATE OR REPLACE FUNCTION public.start_game()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  existing public.game_sessions%ROWTYPE;
  settings_row public.game_settings%ROWTYPE;
  new_set int;
  new_id uuid;
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT * INTO settings_row FROM public.game_settings WHERE id = 1;
  SELECT * INTO existing FROM public.game_sessions WHERE user_id = uid;

  IF FOUND THEN
    -- DISQUALIFIED: only if admin allows; always NEW set, level 1 (no resume)
    IF existing.status = 'disqualified' THEN
      IF NOT COALESCE(settings_row.allow_disqualified_replay, false) THEN
        RAISE EXCEPTION 'Account disqualified. Cannot play again.';
      END IF;
      -- New random set different from previous when possible
      new_set := floor(random() * 6 + 1)::int;
      IF new_set = existing.set_id THEN
        new_set := (existing.set_id % 6) + 1;
      END IF;
      UPDATE public.game_sessions SET
        set_id = new_set,
        current_level = 1,
        levels_completed = '{}',
        fragments = 0,
        score = 0,
        wrong_attempts = 0,
        time_penalty = 0,
        started_at = now(),
        status = 'active',
        completed_at = NULL,
        final_time = NULL
      WHERE user_id = uid
      RETURNING id INTO new_id;
      RETURN jsonb_build_object(
        'session_id', new_id, 'set_id', new_set,
        'current_level', 1, 'status', 'active', 'resumed', false
      );
    END IF;

    IF existing.status = 'completed' THEN
      IF NOT COALESCE(settings_row.allow_replay, false) THEN
        RAISE EXCEPTION 'Quest already completed. Replay not allowed.';
      END IF;
      new_set := floor(random() * 6 + 1)::int;
      IF new_set = existing.set_id THEN
        new_set := (existing.set_id % 6) + 1;
      END IF;
      UPDATE public.game_sessions SET
        set_id = new_set, current_level = 1, levels_completed = '{}',
        fragments = 0, score = 0, wrong_attempts = 0, time_penalty = 0,
        started_at = now(), status = 'active', completed_at = NULL, final_time = NULL
      WHERE user_id = uid
      RETURNING id INTO new_id;
      RETURN jsonb_build_object(
        'session_id', new_id, 'set_id', new_set,
        'current_level', 1, 'status', 'active', 'resumed', false
      );
    END IF;

    -- ACTIVE: resume same set/level
    IF existing.status = 'active' THEN
      RETURN jsonb_build_object(
        'session_id', existing.id, 'set_id', existing.set_id,
        'current_level', existing.current_level, 'status', 'active', 'resumed', true
      );
    END IF;
  END IF;

  new_set := floor(random() * 6 + 1)::int;
  INSERT INTO public.game_sessions (user_id, set_id)
  VALUES (uid, new_set)
  ON CONFLICT (user_id) DO UPDATE SET
    set_id = EXCLUDED.set_id, current_level = 1, levels_completed = '{}',
    fragments = 0, score = 0, wrong_attempts = 0, time_penalty = 0,
    started_at = now(), status = 'active', completed_at = NULL, final_time = NULL
  RETURNING id INTO new_id;

  RETURN jsonb_build_object(
    'session_id', new_id, 'set_id', new_set,
    'current_level', 1, 'status', 'active', 'resumed', false
  );
END;
$$;

NOTIFY pgrst, 'reload schema';
SELECT 'RLS fixed – no more infinite recursion' AS status;
