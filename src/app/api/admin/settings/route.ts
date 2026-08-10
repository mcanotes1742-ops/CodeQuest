import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("game_settings")
      .select("*")
      .eq("id", 1)
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ settings: data });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const supabase = createAdminClient();

    const payload: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };
    if (typeof body.starting_timer === "number")
      payload.starting_timer = body.starting_timer;
    if (typeof body.wrong_answer_penalty === "number")
      payload.wrong_answer_penalty = body.wrong_answer_penalty;
    if (typeof body.memory_duration === "number")
      payload.memory_duration = body.memory_duration;
    if (typeof body.game_active === "boolean")
      payload.game_active = body.game_active;
    if (typeof body.allow_replay === "boolean")
      payload.allow_replay = body.allow_replay;
    if (typeof body.leaderboard_visible === "boolean")
      payload.leaderboard_visible = body.leaderboard_visible;

    const { data, error } = await supabase
      .from("game_settings")
      .update(payload)
      .eq("id", 1)
      .select()
      .single();

    if (error)
      return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ settings: data });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
