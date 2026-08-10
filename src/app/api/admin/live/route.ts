import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  try {
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({ success: false, rows: [], error: "No service role key" });
    }
    const admin = createAdminClient();
    const { data: rows } = await admin
      .from("game_sessions")
      .select("id, user_id, set_id, current_level, fragments, wrong_attempts, last_heartbeat, status")
      .eq("status", "active");

    const userIds = (rows || []).map((r: any) => r.user_id);
    let nameMap = new Map<string, string>();
    if (userIds.length) {
      const { data: profiles } = await admin
        .from("profiles")
        .select("id, display_name")
        .in("id", userIds);
      nameMap = new Map((profiles || []).map((p: any) => [p.id, p.display_name]));
    }

    return NextResponse.json({
      success: true,
      rows: (rows || []).map((r: any) => ({
        id: r.id,
        name: nameMap.get(r.user_id) || "Explorer",
        setId: r.set_id,
        currentLevel: r.current_level,
        fragments: r.fragments,
        wrongAttempts: r.wrong_attempts,
        lastActive: r.last_heartbeat
          ? new Date(r.last_heartbeat).toLocaleTimeString()
          : "—",
      })),
    });
  } catch (e: any) {
    return NextResponse.json({ success: false, rows: [], error: e?.message });
  }
}
