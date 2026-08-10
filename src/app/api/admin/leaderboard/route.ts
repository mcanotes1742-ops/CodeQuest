import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

function formatDuration(seconds: number | null): string {
  if (seconds == null || seconds < 0) return "—";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export async function GET() {
  try {
    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from("game_sessions")
      .select("*, profiles(display_name, play_mode)")
      .eq("status", "completed")
      .order("score", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const sorted = [...(data || [])].sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      const ta = a.final_time ?? 999999;
      const tb = b.final_time ?? 999999;
      if (ta !== tb) return ta - tb;
      return (a.wrong_attempts ?? 0) - (b.wrong_attempts ?? 0);
    });

    const entries = sorted.map((s: any, i: number) => ({
      rank: i + 1,
      name: s.profiles?.display_name || "Unknown",
      playMode: s.profiles?.play_mode || "individual",
      setId: s.set_id,
      score: s.score,
      finalTime: formatDuration(s.final_time),
      wrongAttempts: s.wrong_attempts,
    }));

    return NextResponse.json({ entries });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
