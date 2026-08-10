import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  try {
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({ success: false, error: "No service role key" }, { status: 500 });
    }
    const admin = createAdminClient();
    const { data: sessions } = await admin.from("game_sessions").select("status, score");
    const { count: profileCount } = await admin
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("is_admin", false);

    const list = sessions || [];
    return NextResponse.json({
      success: true,
      totalParticipants: profileCount ?? 0,
      activeNow: list.filter((s: any) => s.status === "active").length,
      completed: list.filter((s: any) => s.status === "completed").length,
      disqualified: list.filter((s: any) => s.status === "disqualified").length,
      avgScore: list.length
        ? Math.round(list.reduce((a: number, s: any) => a + (s.score || 0), 0) / list.length)
        : 0,
    });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message }, { status: 500 });
  }
}
