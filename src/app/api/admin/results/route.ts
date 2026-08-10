import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  try {
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({ success: false, rows: [], error: "No service role key" });
    }
    const admin = createAdminClient();
    const { data: sessions } = await admin
      .from("game_sessions")
      .select("*")
      .in("status", ["completed", "disqualified"]);

    const ids = (sessions || []).map((s: any) => s.user_id);
    let names = new Map<string, string>();
    if (ids.length) {
      const { data: profiles } = await admin
        .from("profiles")
        .select("id, display_name")
        .in("id", ids);
      names = new Map((profiles || []).map((p: any) => [p.id, p.display_name]));
    }

    return NextResponse.json({
      success: true,
      rows: (sessions || []).map((s: any) => ({
        id: s.id,
        name: names.get(s.user_id) || "Explorer",
        setId: s.set_id,
        levelsCompleted: (s.levels_completed || []).length,
        score: s.score,
        wrongAttempts: s.wrong_attempts,
        timePenalty: s.time_penalty,
        finalTime: s.final_time != null ? String(s.final_time) : "—",
        masterKey: s.status === "completed",
        status: s.status,
        completedAt: s.completed_at
          ? new Date(s.completed_at).toLocaleString()
          : "—",
      })),
    });
  } catch (e: any) {
    return NextResponse.json({ success: false, rows: [], error: e?.message });
  }
}
