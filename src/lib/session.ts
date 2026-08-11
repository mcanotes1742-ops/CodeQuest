"use client";

import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase-auth";
import {
  getCurrentUser,
  getUserProgress,
  type PlayMode,
  type TeamMember,
} from "@/lib/auth";
import { getLocalAvatarId } from "@/data/avatars";

export interface AppSession {
  userId: string;
  displayName: string;
  playMode: PlayMode;
  members: TeamMember[] | null;
  setId: number;
  currentLevel: number;
  fragments: number;
  score: number;
  wrongAttempts: number;
  timePenalty: number;
  status: string;
  levelsCompleted: number[];
  sessionId?: string;
  /** ISO timestamp when the game session started (for continuous whole-game timer) */
  startedAt?: string | null;
  /** Profile photo URL or data-URL */
  avatarUrl?: string | null;
  /** Selected face id from AVATARS set */
  avatarId?: string | null;
}

/** Read avatar from localStorage (works offline + as fallback) */
export function getLocalAvatar(userId: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem("cq_avatar_" + userId);
  } catch {
    return null;
  }
}

export function setLocalAvatar(userId: string, dataUrl: string) {
  try {
    localStorage.setItem("cq_avatar_" + userId, dataUrl);
  } catch (e) {
    console.error("Avatar save failed (storage full?)", e);
  }
}

/**
 * Resolve logged-in user from Supabase Auth first, then localStorage fallback.
 * Fixes "Please login first" after Supabase login.
 */
export async function resolveSession(): Promise<AppSession | null> {
  // 1) Supabase path
  if (isSupabaseConfigured()) {
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("display_name, play_mode, team_members, avatar_url")
          .eq("id", user.id)
          .maybeSingle();

        const { data: session } = await supabase
          .from("game_sessions")
          .select("*")
          .eq("user_id", user.id)
          .maybeSingle();

        // Cache for pages that still read local helpers
        const payload = {
          userId: user.id,
          displayName:
            profile?.display_name ||
            user.user_metadata?.display_name ||
            user.email?.split("@")[0] ||
            "Explorer",
          setId: session?.set_id ?? 1,
          currentLevel: session?.current_level ?? 1,
          sessionId: session?.id,
        };
        try {
          localStorage.setItem("cq_supabase_session", JSON.stringify(payload));
          localStorage.setItem("cq_session", user.id);
        } catch {}

        const localAv = getLocalAvatar(user.id);
        const avatarUrl = localAv || (profile?.avatar_url?.startsWith("data:") ? profile.avatar_url : null) || null;
        let avatarId =
          getLocalAvatarId(user.id) ||
          (profile?.avatar_url?.startsWith("avatar:") ? profile.avatar_url.slice(7) : null) ||
          null;
        return {
          userId: user.id,
          displayName: payload.displayName,
          playMode: (profile?.play_mode as PlayMode) || "individual",
          members: (profile?.team_members as TeamMember[]) || null,
          setId: session?.set_id ?? 1,
          currentLevel: session?.current_level ?? 1,
          fragments: session?.fragments ?? 0,
          score: session?.score ?? 0,
          wrongAttempts: session?.wrong_attempts ?? 0,
          timePenalty: session?.time_penalty ?? 0,
          status: session?.status ?? "active",
          levelsCompleted: Array.isArray(session?.levels_completed)
            ? session.levels_completed
            : [],
          sessionId: session?.id,
          startedAt: session?.started_at ?? null,
          avatarUrl,
          avatarId,
        };
      }
    } catch (e) {
      console.error("resolveSession supabase error", e);
    }
  }

  // 2) localStorage from last Supabase login
  try {
    const raw = localStorage.getItem("cq_supabase_session");
    if (raw) {
      const s = JSON.parse(raw);
      if (s.userId) {
        // Never allow play if this account was marked disqualified locally
        let status = s.status || "active";
        const progress = getUserProgress(s.userId);
        try {
          if (localStorage.getItem("cq_disqualified_" + s.userId) === "1") {
            status = "disqualified";
          }
          if (progress?.status === "disqualified") status = "disqualified";
        } catch {}
        return {
          userId: s.userId,
          displayName: s.displayName || "Explorer",
          playMode: "individual",
          members: null,
          setId: s.setId || progress?.setId || 1,
          currentLevel: s.currentLevel || progress?.currentLevel || 1,
          fragments: progress?.fragments ?? 0,
          score: progress?.score ?? 0,
          wrongAttempts: progress?.wrongAttempts ?? 0,
          timePenalty: progress?.timePenalty ?? 0,
          status,
          levelsCompleted: progress?.levelsCompleted ?? [],
          sessionId: s.sessionId,
          startedAt: progress?.startedAt ?? null,
          avatarUrl: getLocalAvatar(s.userId) || s.avatarUrl || null,
          avatarId: getLocalAvatarId(s.userId) || s.avatarId || null,
        };
      }
    }
  } catch {}

  // 3) Legacy local auth
  const user = getCurrentUser();
  if (!user) return null;
  const progress = getUserProgress(user.id);
  return {
    userId: user.id,
    displayName: user.displayName,
    playMode: user.playMode || "individual",
    members: user.members || null,
    setId: progress?.setId ?? 1,
    currentLevel: progress?.currentLevel ?? 1,
    fragments: progress?.fragments ?? 0,
    score: progress?.score ?? 0,
    wrongAttempts: progress?.wrongAttempts ?? 0,
    timePenalty: progress?.timePenalty ?? 0,
    status: progress?.status ?? "active",
    levelsCompleted: progress?.levelsCompleted ?? [],
    startedAt: progress?.startedAt ?? null,
    avatarUrl: getLocalAvatar(user.id),
    avatarId: getLocalAvatarId(user.id),
  };
}
