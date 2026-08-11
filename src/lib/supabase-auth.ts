/**
 * Supabase-backed auth + game session helpers.
 * All participant data goes to Supabase when env is configured.
 */
import { createClient } from "@/lib/supabase/client";
import type { PlayMode, TeamMember } from "@/lib/auth";


async function pickBalancedSetIdSupabase(
  supabase: ReturnType<typeof createClient>
): Promise<number> {
  const { data } = await supabase.from("game_sessions").select("set_id");
  const counts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
  for (const row of data || []) {
    const id = Number(row.set_id);
    if (id >= 1 && id <= 6) counts[id] = (counts[id] || 0) + 1;
  }
  let min = Infinity;
  const candidates: number[] = [];
  for (let i = 1; i <= 6; i++) {
    if (counts[i] < min) {
      min = counts[i];
      candidates.length = 0;
      candidates.push(i);
    } else if (counts[i] === min) candidates.push(i);
  }
  return candidates[Math.floor(Math.random() * candidates.length)] || await pickBalancedSetIdSupabase(supabase);
}

export function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return !!(url && key && !url.includes("your-project") && !url.includes("xxxxx"));
}

export async function supabaseRegister(params: {
  email: string;
  password: string;
  displayName: string;
  playMode: PlayMode;
  members?: TeamMember[];
}): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();

  const { data, error } = await supabase.auth.signUp({
    email: params.email,
    password: params.password,
    options: {
      data: {
        display_name: params.displayName,
        play_mode: params.playMode,
        team_members: params.members || null,
      },
    },
  });

  if (error) {
    return { success: false, error: error.message };
  }

  // Profile is created by trigger handle_new_user.
  // Update play_mode / team_members on profile.
  if (data.user) {
    const { error: upErr } = await supabase
      .from("profiles")
      .update({
        display_name: params.displayName,
        play_mode: params.playMode,
        team_members: params.members || null,
      })
      .eq("id", data.user.id);

    // If trigger hasn't fired yet, upsert
    if (upErr) {
      await supabase.from("profiles").upsert({
        id: data.user.id,
        display_name: params.displayName,
        play_mode: params.playMode,
        team_members: params.members || null,
        is_admin: false,
      });
    }
  }

  return { success: true };
}

export async function supabaseLogin(
  email: string,
  password: string
): Promise<{ success: boolean; error?: string; userId?: string; displayName?: string }> {
  const supabase = createClient();

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  if (!data.user) {
    return { success: false, error: "Login failed" };
  }

  // Check disqualification + settings
  const { data: session } = await supabase
    .from("game_sessions")
    .select("status")
    .eq("user_id", data.user.id)
    .maybeSingle();

  if (session?.status === "disqualified") {
    const { data: settings } = await supabase
      .from("game_settings")
      .select("allow_disqualified_replay")
      .eq("id", 1)
      .single();

    if (!settings?.allow_disqualified_replay) {
      await supabase.auth.signOut();
      return {
        success: false,
        error: "This account has been disqualified and cannot play again.",
      };
    }
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", data.user.id)
    .single();

  return {
    success: true,
    userId: data.user.id,
    displayName: profile?.display_name || data.user.email || "Explorer",
  };
}

export async function supabaseStartGame(): Promise<{
  success: boolean;
  error?: string;
  setId?: number;
  currentLevel?: number;
  sessionId?: string;
}> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated" };

  // Prefer RPC if available
  const { data: rpcData, error: rpcError } = await supabase.rpc("start_game");
  if (!rpcError && rpcData) {
    return {
      success: true,
      setId: rpcData.set_id,
      currentLevel: rpcData.current_level,
      sessionId: rpcData.session_id,
    };
  }

  // Fallback manual logic
  const { data: settings } = await supabase
    .from("game_settings")
    .select("*")
    .eq("id", 1)
    .single();

  const { data: existing } = await supabase
    .from("game_sessions")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing) {
    if (existing.status === "disqualified") {
      if (!settings?.allow_disqualified_replay) {
        return { success: false, error: "Account disqualified. Cannot play again." };
      }
      const newSet = await pickBalancedSetIdSupabase(supabase);
      const { data: updated, error } = await supabase
        .from("game_sessions")
        .update({
          set_id: newSet,
          current_level: 1,
          levels_completed: [],
          fragments: 0,
          score: 0,
          wrong_attempts: 0,
          time_penalty: 0,
          started_at: new Date().toISOString(),
          status: "active",
          completed_at: null,
          final_time: null,
        })
        .eq("user_id", user.id)
        .select()
        .single();
      if (error) return { success: false, error: error.message };
      return {
        success: true,
        setId: updated.set_id,
        currentLevel: 1,
        sessionId: updated.id,
      };
    }

    if (existing.status === "completed" && !settings?.allow_replay) {
      return { success: false, error: "Quest already completed. Replay not allowed." };
    }

    if (existing.status === "active") {
      return {
        success: true,
        setId: existing.set_id,
        currentLevel: existing.current_level,
        sessionId: existing.id,
      };
    }
  }

  const setId = await pickBalancedSetIdSupabase(supabase);
  const { data: created, error } = await supabase
    .from("game_sessions")
    .upsert(
      {
        user_id: user.id,
        set_id: setId,
        current_level: 1,
        levels_completed: [],
        fragments: 0,
        score: 0,
        wrong_attempts: 0,
        time_penalty: 0,
        status: "active",
        started_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    )
    .select()
    .single();

  if (error) return { success: false, error: error.message };

  return {
    success: true,
    setId: created.set_id,
    currentLevel: 1,
    sessionId: created.id,
  };
}

export async function supabaseDisqualify(): Promise<void> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from("game_sessions")
    .update({ status: "disqualified", completed_at: new Date().toISOString() })
    .eq("user_id", user.id)
    .eq("status", "active");

  await supabase.auth.signOut();
}

export async function supabaseGetParticipants() {
  const supabase = createClient();

  const { data: profiles, error } = await supabase
    .from("profiles")
    .select("id, display_name, play_mode, team_members, created_at, is_admin")
    .order("created_at", { ascending: false });

  if (error) throw error;

  const { data: sessions } = await supabase.from("game_sessions").select("*");
  const sessionMap = new Map((sessions || []).map((s: any) => [s.user_id, s]));

  return (profiles || [])
    .filter((p: any) => !p.is_admin)
    .map((p: any) => {
      const s = sessionMap.get(p.id);
      return {
        id: p.id,
        name: p.display_name,
        email: "",
        playMode: p.play_mode || "individual",
        members: p.team_members || null,
        setId: s?.set_id ?? null,
        status: s?.status ?? "not_started",
        currentLevel: s?.current_level ?? 0,
        score: s?.score ?? 0,
        fragments: s?.fragments ?? 0,
        wrongAttempts: s?.wrong_attempts ?? 0,
        joinedAt: p.created_at,
      };
    });
}

export async function supabaseUpdateProgress(updates: {
  current_level?: number;
  levels_completed?: number[];
  fragments?: number;
  score?: number;
  wrong_attempts?: number;
  time_penalty?: number;
  status?: string;
  final_time?: number;
  completed_at?: string;
}) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error("Not authenticated – cannot save progress");
  }

  const { error } = await supabase
    .from("game_sessions")
    .update({ ...updates, last_heartbeat: new Date().toISOString() })
    .eq("user_id", user.id);

  if (error) {
    console.error("supabaseUpdateProgress error:", error);
    throw new Error(error.message);
  }
}
