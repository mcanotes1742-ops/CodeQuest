"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { resolveSession } from "@/lib/session";
import { AVATARS, setLocalAvatarId, getLocalAvatarId } from "@/data/avatars";
import { isSupabaseConfigured } from "@/lib/supabase-auth";
import { createClient } from "@/lib/supabase/client";
import { getUserProgress, updateProgress } from "@/lib/auth";

/**
 * After login: pick a face from the set.
 * Route: /avatar-select
 */
export default function AvatarSelectPage() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [name, setName] = useState("Explorer");
  const [selected, setSelected] = useState<string>("explorer");
  const [ready, setReady] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const session = await resolveSession();
      if (!session) {
        toast.error("Please login first");
        router.replace("/login");
        return;
      }
      setUserId(session.userId);
      setName(session.displayName);
      const existing = session.avatarId || getLocalAvatarId(session.userId);
      if (existing) setSelected(existing);
      setReady(true);
    })();
  }, [router]);

  const confirm = async () => {
    if (!userId) return;
    setSaving(true);
    try {
      setLocalAvatarId(userId, selected);

      // Clear old false-positive DQ so briefing does not bounce to results
      try {
        localStorage.removeItem("cq_disqualified_" + userId);
      } catch {}
      try {
        const prog = getUserProgress(userId);
        if (prog && prog.status === "disqualified") {
          updateProgress(userId, { status: "active", completedAt: null });
        }
      } catch {}

      if (isSupabaseConfigured()) {
        try {
          const supabase = createClient();
          await supabase
            .from("profiles")
            .update({ avatar_url: "avatar:" + selected })
            .eq("id", userId);
          // If a previous false DQ left session disqualified, reactivate for play
          await supabase
            .from("game_sessions")
            .update({ status: "active", completed_at: null })
            .eq("user_id", userId)
            .eq("status", "disqualified");
        } catch (e) {
          console.error(e);
        }
      }

      try {
        const raw = localStorage.getItem("cq_supabase_session");
        if (raw) {
          const s = JSON.parse(raw);
          s.avatarId = selected;
          localStorage.setItem("cq_supabase_session", JSON.stringify(s));
        }
      } catch {}

      toast.success("Avatar selected!");
      router.replace("/briefing");
    } catch (e: any) {
      toast.error(e?.message || "Failed");
    }
    setSaving(false);
  };

  if (!ready) {
    return (
      <main className="sky-bg min-h-screen flex items-center justify-center">
        <p className="text-cyan-400 font-display animate-pulse">Loading...</p>
      </main>
    );
  }

  return (
    <main className="sky-bg min-h-screen flex items-center justify-center px-4 py-10">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="quest-card max-w-2xl w-full p-8"
      >
        <h1 className="font-display text-2xl md:text-3xl text-cyan-400 text-center neon-text mb-2">
          CHOOSE YOUR AVATAR
        </h1>
        <p className="text-center text-slate-400 text-sm mb-8">
          Welcome, <span className="text-slate-200 font-semibold">{name}</span> — pick a face for your profile
        </p>

        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 mb-8">
          {AVATARS.map((a) => {
            const isOn = selected === a.id;
            return (
              <button
                key={a.id}
                type="button"
                onClick={() => setSelected(a.id)}
                className={`
                  flex flex-col items-center gap-1 p-3 rounded-2xl border-2 transition-transform duration-75
                  active:scale-95
                  ${isOn
                    ? "border-cyan-400 bg-cyan-950/50 ring-2 ring-cyan-400/50 shadow-[0_0_20px_rgba(0,240,255,0.25)]"
                    : "border-slate-700 bg-slate-900/50 hover:border-cyan-500/40"}
                `}
              >
                <div
                  className={`w-14 h-14 rounded-full bg-gradient-to-br ${a.bg} flex items-center justify-center text-3xl shadow-inner`}
                >
                  {a.emoji}
                </div>
                <span className={`text-[11px] font-semibold ${isOn ? "text-cyan-300" : "text-slate-400"}`}>
                  {a.label}
                </span>
              </button>
            );
          })}
        </div>

        <button
          type="button"
          disabled={saving}
          onClick={confirm}
          className="btn-cyber w-full py-3.5 rounded-xl font-bold text-lg"
        >
          {saving ? "SAVING..." : "CONTINUE"}
        </button>
      </motion.div>
    </main>
  );
}
