import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Instantly mark current user's session as disqualified in Supabase.
 */
export async function POST(req: NextRequest) {
  try {
    let reason = "anti-cheat";
    try {
      const body = await req.json();
      if (body?.reason) reason = String(body.reason);
    } catch {
      // empty body ok
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      // Try service role with nothing — cannot identify user
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Prefer user client first
    const { error } = await supabase
      .from("game_sessions")
      .update({
        status: "disqualified",
        completed_at: new Date().toISOString(),
      })
      .eq("user_id", user.id)
      .eq("status", "active");

    // Fallback with service role if RLS blocks
    if (error && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      const admin = createAdminClient();
      await admin
        .from("game_sessions")
        .update({
          status: "disqualified",
          completed_at: new Date().toISOString(),
        })
        .eq("user_id", user.id)
        .eq("status", "active");
    }

    return NextResponse.json({ ok: true, reason });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Failed" }, { status: 500 });
  }
}
