import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Server-side register using SERVICE ROLE.
 * Creates user with email already confirmed → no confirmation email → avoids free-tier email rate limit.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      email,
      password,
      displayName,
      playMode = "individual",
      members = null,
    } = body;

    if (!email || !password || !displayName) {
      return NextResponse.json(
        { success: false, error: "Email, password and name are required" },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { success: false, error: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    if (!process.env.SUPABASE_SERVICE_ROLE_KEY || !process.env.NEXT_PUBLIC_SUPABASE_URL) {
      return NextResponse.json(
        {
          success: false,
          error: "Server missing SUPABASE_SERVICE_ROLE_KEY or URL in .env.local",
        },
        { status: 500 }
      );
    }

    const admin = createAdminClient();

    // Unique display name (case-insensitive), even if email is different
    const nameNorm = String(displayName).trim();
    if (nameNorm.length < 2) {
      return NextResponse.json(
        { success: false, error: "Display name must be at least 2 characters" },
        { status: 400 }
      );
    }
    const { data: existingProfiles } = await admin
      .from("profiles")
      .select("id, display_name, team_members");
    const nameLower = nameNorm.toLowerCase();
    const nameTaken = (existingProfiles || []).some((p: any) => {
      if (String(p.display_name || "").trim().toLowerCase() === nameLower) return true;
      const members = p.team_members;
      if (Array.isArray(members)) {
        return members.some(
          (m: any) => String(m?.name || "").trim().toLowerCase() === nameLower
        );
      }
      return false;
    });
    if (nameTaken) {
      return NextResponse.json(
        { success: false, error: "This name is already taken. Choose a different name." },
        { status: 400 }
      );
    }

    // Team member names unique too
    if (playMode === "team" && Array.isArray(members)) {
      for (const m of members) {
        const mn = String(m?.name || "").trim().toLowerCase();
        if (!mn) continue;
        const memberTaken = (existingProfiles || []).some((p: any) => {
          if (String(p.display_name || "").trim().toLowerCase() === mn) return true;
          if (Array.isArray(p.team_members)) {
            return p.team_members.some(
              (tm: any) => String(tm?.name || "").trim().toLowerCase() === mn
            );
          }
          return false;
        });
        if (memberTaken) {
          return NextResponse.json(
            { success: false, error: `Name "${m.name}" is already taken. Choose a different name.` },
            { status: 400 }
          );
        }
      }
    }

    // Create user – email_confirm: true means NO email is sent
    const { data: created, error: createError } = await admin.auth.admin.createUser({
      email: String(email).trim().toLowerCase(),
      password: String(password),
      email_confirm: true,
      user_metadata: {
        display_name: displayName,
        play_mode: playMode,
        team_members: members,
      },
    });

    if (createError) {
      const msg = createError.message || "Could not create user";
      // Friendlier messages
      if (msg.toLowerCase().includes("already") || msg.toLowerCase().includes("registered")) {
        return NextResponse.json(
          { success: false, error: "Email already registered. Please login." },
          { status: 400 }
        );
      }
      if (msg.toLowerCase().includes("rate")) {
        return NextResponse.json(
          {
            success: false,
            error: "Too many attempts. Wait a few minutes or create user in Supabase Dashboard → Authentication → Users.",
          },
          { status: 429 }
        );
      }
      return NextResponse.json({ success: false, error: msg }, { status: 400 });
    }

    if (!created.user) {
      return NextResponse.json(
        { success: false, error: "User creation failed" },
        { status: 500 }
      );
    }

    // Ensure profile row (trigger may also create it)
    const { error: profileError } = await admin.from("profiles").upsert(
      {
        id: created.user.id,
        display_name: displayName,
        play_mode: playMode === "team" ? "team" : "individual",
        team_members: playMode === "team" ? members : null,
        is_admin: false,
      },
      { onConflict: "id" }
    );

    if (profileError) {
      console.error("Profile upsert error:", profileError.message);
      // User exists in auth; profile can be fixed later
    }

    return NextResponse.json({
      success: true,
      userId: created.user.id,
      message: "Account created. You can login now.",
    });
  } catch (e: any) {
    console.error("Register API error:", e);
    return NextResponse.json(
      { success: false, error: e?.message || "Server error" },
      { status: 500 }
    );
  }
}
