"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase-auth";
import { getAllParticipantsForAdmin } from "@/lib/auth";

interface Entry {
  rank: number;
  name: string;
  setId: number | null;
  score: number;
  wrongAttempts: number;
}

export default function LeaderboardPage() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [source, setSource] = useState<"supabase" | "local">("local");

  useEffect(() => {
    (async () => {
      if (isSupabaseConfigured()) {
        try {
          const supabase = createClient();
          // Prefer view if available
          const { data: viewData, error } = await supabase
            .from("leaderboard")
            .select("*");

          if (!error && viewData && viewData.length >= 0) {
            setEntries(
              viewData.map((r: any, i: number) => ({
                rank: i + 1,
                name: r.display_name,
                setId: r.set_id,
                score: r.score,
                wrongAttempts: r.wrong_attempts,
              }))
            );
            setSource("supabase");
            return;
          }

          const { data: sessions } = await supabase
            .from("game_sessions")
            .select("user_id, set_id, score, wrong_attempts, final_time")
            .eq("status", "completed")
            .order("score", { ascending: false });

          if (sessions) {
            const ids = sessions.map((s: any) => s.user_id);
            const { data: profiles } = await supabase
              .from("profiles")
              .select("id, display_name")
              .in("id", ids.length ? ids : ["00000000-0000-0000-0000-000000000000"]);
            const names = new Map(
              (profiles || []).map((p: any) => [p.id, p.display_name])
            );
            setEntries(
              sessions.map((s: any, i: number) => ({
                rank: i + 1,
                name: names.get(s.user_id) || "Explorer",
                setId: s.set_id,
                score: s.score,
                wrongAttempts: s.wrong_attempts,
              }))
            );
            setSource("supabase");
            return;
          }
        } catch {}
      }

      const local = getAllParticipantsForAdmin()
        .filter((p) => p.status === "completed")
        .sort((a, b) => b.score - a.score)
        .map((p, i) => ({
          rank: i + 1,
          name: p.name,
          setId: p.setId,
          score: p.score,
          wrongAttempts: p.wrongAttempts,
        }));
      setEntries(local);
      setSource("local");
    })();
  }, []);

  return (
    <div>
      <div className="flex items-center gap-3 mb-2">
        <h1 className="font-cyber text-2xl text-cyan-400">Leaderboard</h1>
        <span
          className={`text-xs px-2 py-1 rounded ${
            source === "supabase"
              ? "bg-emerald-500/20 text-emerald-400"
              : "bg-amber-500/20 text-amber-400"
          }`}
        >
          {source === "supabase" ? "● Supabase" : "○ Local"}
        </span>
      </div>
      <p className="text-sm text-slate-500 mb-6">
        Ranking: Highest Score → Lowest Time → Fewest Wrongs
      </p>

      {entries.length === 0 ? (
        <div className="glass rounded-xl p-10 text-center text-slate-400">
          <p className="text-lg mb-2">No completed quests yet</p>
          <p className="text-sm">Leaderboard fills when players finish the game.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {entries.map((e, i) => (
            <motion.div
              key={e.rank}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              className={`glass rounded-xl p-4 flex items-center gap-4 ${
                e.rank === 1 ? "border border-amber-400/50 shadow-neon-gold" : ""
              }`}
            >
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg ${
                  e.rank === 1
                    ? "bg-gradient-to-br from-amber-400 to-yellow-600 text-black"
                    : e.rank === 2
                    ? "bg-gradient-to-br from-slate-300 to-slate-500 text-black"
                    : e.rank === 3
                    ? "bg-gradient-to-br from-amber-700 to-amber-900 text-white"
                    : "bg-slate-700 text-slate-300"
                }`}
              >
                {e.rank}
              </div>
              <div className="flex-1">
                <p className="font-medium text-slate-100">{e.name}</p>
                <p className="text-xs text-slate-500">
                  {e.setId ? `Set #${e.setId}` : "—"}
                </p>
              </div>
              <div className="text-right">
                <p className="font-mono text-xl text-cyan-300">{e.score}</p>
                <p className="text-xs text-slate-500">score</p>
              </div>
              <div className="text-right hidden sm:block">
                <p className="font-mono text-red-400">{e.wrongAttempts}</p>
                <p className="text-xs text-slate-500">wrongs</p>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
