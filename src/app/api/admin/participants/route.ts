import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Admin-only list of participants.
 * Uses SERVICE ROLE so it works even when admin is not a Supabase user.
 */
export async function GET() {
  try {
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY || !process.env.NEXT_PUBLIC_SUPABASE_URL) {
      return NextResponse.json(
        { success: false, error: "Missing SUPABASE_SERVICE_ROLE_KEY in .env.local", rows: [] },
        { status: 500 }
      );
    }

    const admin = createAdminClient();

    const { data: profiles, error: pErr } = await admin
      .from("profiles")
      .select("id, display_name, play_mode, team_members, created_at, is_admin, avatar_url")
      .order("created_at", { ascending: false });

    if (pErr) {
      return NextResponse.json(
        { success: false, error: pErr.message, rows: [] },
        { status: 500 }
      );
    }

    const { data: sessions } = await admin.from("game_sessions").select("*");
    const sessionMap = new Map((sessions || []).map((s: any) => [s.user_id, s]));

    const rows = (profiles || [])
      .filter((p: any) => !p.is_admin)
      .map((p: any) => {
        const s = sessionMap.get(p.id);
        return {
          id: p.id,
          name: p.display_name,
          avatarId: typeof p.avatar_url === "string" && p.avatar_url.startsWith("avatar:")
            ? p.avatar_url.slice(7)
            : null,
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

    return NextResponse.json({ success: true, rows, source: "supabase" });
  } catch (e: any) {
    return NextResponse.json(
      { success: false, error: e?.message || "Server error", rows: [] },
      { status: 500 }
    );
  }
}
