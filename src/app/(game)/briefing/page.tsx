"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { resolveSession } from "@/lib/session";
import { getAvatarById, getLocalAvatarId } from "@/data/avatars";
import { isSupabaseConfigured, supabaseStartGame } from "@/lib/supabase-auth";

export default function BriefingPage() {
  const router = useRouter();
  const [setId, setSetId] = useState<number | null>(null);
  const [name, setName] = useState("");
  const [avatarId, setAvatarId] = useState<string>("explorer");
  const [playMode, setPlayMode] = useState<"individual" | "team">("individual");
  const [members, setMembers] = useState<{ name: string; email: string }[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const session = await resolveSession();
      if (!session) {
        toast.error("Please login first");
        router.replace("/login");
        return;
      }
      // Only trust live session status (local sticky flag caused false DQ after avatar)
      if (session.status === "disqualified") {
        toast.error("This account is disqualified and cannot play.");
        router.replace("/result?status=disqualified");
        return;
      }
      setName(session.displayName);
      setPlayMode(session.playMode || "individual");
      setMembers(session.members);
      setAvatarId(session.avatarId || getLocalAvatarId(session.userId) || "explorer");

      if (isSupabaseConfigured()) {
        const game = await supabaseStartGame();
        if (!game.success) {
          toast.error(game.error || "Cannot start game");
          if (game.error?.toLowerCase().includes("disqualified")) {
            router.replace("/result?status=disqualified");
          } else router.replace("/login");
          return;
        }
        setSetId(game.setId ?? session.setId);
      } else setSetId(session.setId);
      setLoading(false);
    })();
  }, [router]);

  if (loading) {
    return (
      <main className="sky-bg min-h-screen flex items-center justify-center">
        <p className="font-display text-cyan-400 text-xl animate-pulse">Loading mission...</p>
      </main>
    );
  }

  return (
    <main className="sky-bg min-h-screen flex items-center justify-center px-4 py-10">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="quest-card max-w-lg w-full p-8 md:p-10 text-center"
      >
        {/* Selected avatar face */}
        <div className="mx-auto mb-5 flex flex-col items-center">
          {(() => {
            const av = getAvatarById(avatarId);
            return (
              <div
                className={`w-28 h-28 rounded-full bg-gradient-to-br ${av.bg} flex items-center justify-center text-5xl border-4 border-cyan-400/40 shadow-lg`}
              >
                {av.emoji}
              </div>
            );
          })()}
          <p className="text-xs text-slate-400 mt-2">{getAvatarById(avatarId).label}</p>
        </div>

        <div className="inline-flex items-center gap-2 bg-amber-950/50 text-amber-300 px-4 py-1.5 rounded-full text-xs font-bold mb-4 border border-amber-500/40">
          ◎ MISSION ACCEPTED!
        </div>

        <h1 className="font-display text-2xl md:text-3xl text-cyan-400 font-bold mb-3">
          Welcome, {name}!
        </h1>

        <div className="mb-4">
          {playMode === "team" ? (
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-purple-900/50 text-purple-300 border border-purple-500/40">
              👥 Team of 2
            </span>
          ) : (
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-sky-900/50 text-sky-300 border border-sky-500/40">
              Individual Explorer
            </span>
          )}
        </div>

        {playMode === "team" && members && (
          <div className="text-sm text-slate-300 mb-4 space-y-1">
            {members.map((m, i) => (
              <p key={i}>Member {i + 1}: <strong>{m.name}</strong></p>
            ))}
          </div>
        )}

        <p className="text-slate-300 leading-relaxed mb-2">
          You are a Code Explorer{playMode === "team" ? " team" : ""}.
        </p>
        <p className="text-slate-300 leading-relaxed mb-4">
          Your mission is to collect all{" "}
          <strong className="text-amber-400">Master Key Fragments</strong> hidden
          in the ancient chambers and unlock the final treasure.
        </p>
        {setId && (
          <p className="text-cyan-400 text-sm font-bold mb-6">
            Assigned Quest Set: #{setId}
          </p>
        )}
        <p className="text-slate-500 mb-8 italic">
          Good luck, Explorer{playMode === "team" ? "s" : ""}!
        </p>

        <button onClick={() => router.push("/map")} className="btn-sky px-10 py-3.5 text-lg">
          LET&apos;S GO!
        </button>
      </motion.div>
    </main>
  );
}
