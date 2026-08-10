import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Admin removes disqualification.
 * Session stays disqualified until user logs in again —
 * when allow_disqualified_replay is ON, start_game assigns a NEW set from level 1.
 * This endpoint just flags them eligible by setting status to abandoned
 * OR we leave as disqualified and rely on allow_disqualified_replay.
 *
 * Better: set status to 'abandoned' so they can start fresh, and force new set on next login.
 */
export async function POST(req: NextRequest) {
  try {
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({ success: false, error: "No service role key" }, { status: 500 });
    }
    const { userId } = await req.json();
    if (!userId) {
      return NextResponse.json({ success: false, error: "userId required" }, { status: 400 });
    }

    const admin = createAdminClient();

    // Get previous set to assign a different one
    const { data: existing } = await admin
      .from("game_sessions")
      .select("set_id")
      .eq("user_id", userId)
      .maybeSingle();

    let newSet = Math.floor(Math.random() * 6) + 1;
    if (existing?.set_id && newSet === existing.set_id) {
      newSet = (existing.set_id % 6) + 1;
    }

    // Reset to fresh active session with NEW set (not same leftover level)
    const { error } = await admin
      .from("game_sessions")
      .update({
        status: "active",
        set_id: newSet,
        current_level: 1,
        levels_completed: [],
        fragments: 0,
        score: 0,
        wrong_attempts: 0,
        time_penalty: 0,
        started_at: new Date().toISOString(),
        completed_at: null,
        final_time: null,
      })
      .eq("user_id", userId);

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: "User can play again from level 1 with a new set",
      newSet,
    });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message }, { status: 500 });
  }
}
