import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const levelNumber = parseInt(req.nextUrl.searchParams.get("level") || "0", 10);
    if (levelNumber < 1 || levelNumber > 6) {
      return NextResponse.json({ error: "Invalid level" }, { status: 400 });
    }

    const { data: session, error: sessErr } = await supabase
      .from("game_sessions")
      .select("id, set_id, current_level, status")
      .eq("user_id", user.id)
      .single();

    if (sessErr || !session) {
      return NextResponse.json({ error: "No active session" }, { status: 404 });
    }

    if (session.status !== "active") {
      return NextResponse.json({ error: "Session not active" }, { status: 403 });
    }

    if (levelNumber > session.current_level) {
      return NextResponse.json({ error: "Level locked" }, { status: 403 });
    }

    const { data: level, error: lvlErr } = await supabase
      .from("levels_public")
      .select("*")
      .eq("set_id", session.set_id)
      .eq("level_number", levelNumber)
      .single();

    if (lvlErr || !level) {
      return NextResponse.json({ error: "Level not found" }, { status: 404 });
    }

    // Shuffle arrangement lines server-side
    if (level.level_type === "arrangement" && Array.isArray(level.shuffled_lines)) {
      const lines = [...level.shuffled_lines];
      for (let i = lines.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [lines[i], lines[j]] = [lines[j], lines[i]];
      }
      level.shuffled_lines = lines;
    }

    return NextResponse.json({ level, sessionId: session.id });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
