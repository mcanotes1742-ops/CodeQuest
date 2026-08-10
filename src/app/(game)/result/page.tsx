"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  getCurrentUser,
  getUserProgress,
  getUsers,
} from "@/lib/auth";

function ResultContent() {
  const router = useRouter();
  const search = useSearchParams();
  const [data, setData] = useState<{
    name: string;
    setId: number | null;
    levels: number;
    fragments: number;
    score: number;
    wrongs: number;
    status: string;
  } | null>(null);

  useEffect(() => {
    const statusParam = search.get("status");
    const user = getCurrentUser();
    let name = "Explorer";
    let progress = null;

    if (user) {
      name = user.displayName;
      progress = getUserProgress(user.id);
    } else {
      try {
        const all = JSON.parse(localStorage.getItem("cq_progress") || "{}");
        const ids = Object.keys(all);
        if (ids.length) {
          const sorted = ids
            .map((id) => ({ id, p: all[id] }))
            .sort((a, b) =>
              String(b.p?.completedAt || "").localeCompare(
                String(a.p?.completedAt || "")
              )
            );
          const last = sorted[0];
          if (last) {
            progress = last.p;
            const users = getUsers();
            const u = users.find((x) => x.id === last.id);
            if (u) name = u.displayName;
          }
        }
        const raw = localStorage.getItem("cq_supabase_session");
        if (raw) {
          const s = JSON.parse(raw);
          if (s.displayName) name = s.displayName;
        }
      } catch {}
    }

    setData({
      name,
      setId: progress?.setId ?? null,
      levels: progress?.levelsCompleted?.length ?? 0,
      fragments: progress?.fragments ?? 0,
      score: progress?.score ?? 0,
      wrongs: progress?.wrongAttempts ?? 0,
      status: statusParam || progress?.status || "unknown",
    });
  }, [search]);

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center text-cyan-400">
        Loading results...
      </div>
    );
  }

  const isDq = data.status === "disqualified";
  const isTimeout = data.status === "timeout";

  return (
    <main className="sky-bg min-h-screen flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="quest-card p-8 rounded-2xl max-w-md w-full"
      >
        <h1 className="font-display text-2xl text-cyan-400 text-center mb-6 neon-text">
          QUEST RESULTS
        </h1>

        {isDq && (
          <div className="bg-red-950/50 border border-red-500/60 rounded-lg p-4 mb-6 text-center">
            <p className="text-red-400 font-semibold text-lg font-display">
              DISQUALIFIED
            </p>
            <p className="text-red-200/70 text-sm mt-1">
              Anti-cheat triggered. This account can no longer play the game.
            </p>
          </div>
        )}

        {isTimeout && (
          <div className="bg-amber-950/50 border border-amber-500/60 rounded-lg p-4 mb-6 text-center">
            <p className="text-amber-400 font-semibold text-lg font-display">
              TIME UP
            </p>
            <p className="text-amber-200/70 text-sm mt-1">
              The 30-minute timer ran out before the quest was completed.
            </p>
          </div>
        )}

        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-400">Participant</span>
            <span className="text-slate-100">{data.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Assigned Set</span>
            <span className="text-cyan-300">
              {data.setId ? `#${data.setId}` : "—"}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Levels Completed</span>
            <span className="text-slate-100">{data.levels}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Fragments</span>
            <span className="text-amber-400">{data.fragments}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Score</span>
            <span className="text-emerald-400">{data.score}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Wrong Attempts</span>
            <span className="text-slate-100">{data.wrongs}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Master Key</span>
            <span>{data.levels >= 6 ? "✅ Found" : "❌ Not found"}</span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => router.replace("/")}
          className="btn-cyber w-full mt-8 py-3 rounded-xl text-white font-bold"
        >
          RETURN HOME
        </button>
      </motion.div>
    </main>
  );
}

export default function ResultPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center text-cyan-400">
          Loading results...
        </div>
      }
    >
      <ResultContent />
    </Suspense>
  );
}
