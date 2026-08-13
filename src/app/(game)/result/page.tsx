"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { resolveSession } from "@/lib/session";
import { getCurrentUser, getUserProgress } from "@/lib/auth";
import { loadCollectedKeys, LEVEL_KEYS } from "@/data/keys";

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
    keys: string[];
  } | null>(null);

  useEffect(() => {
    (async () => {
      const statusParam = search.get("status");

      // 1) Snapshot saved at DQ time (most accurate for stats)
      try {
        const snapRaw = sessionStorage.getItem("cq_result_snapshot");
        if (snapRaw) {
          const snap = JSON.parse(snapRaw);
          const levelsCount = Array.isArray(snap.levelsCompleted)
            ? snap.levelsCompleted.length
            : Math.max(0, (snap.currentLevel || 1) - 1);
          setData({
            name: snap.name || "Explorer",
            setId: snap.setId ?? null,
            levels: levelsCount,
            fragments: snap.fragments ?? 0,
            score: snap.score ?? 0,
            wrongs: snap.wrongAttempts ?? 0,
            status: statusParam || snap.status || "disqualified",
            keys: snap.userId ? loadCollectedKeys(snap.userId) : [],
          });
          return;
        }
      } catch {}

      // 2) resolveSession
      try {
        const session = await resolveSession();
        if (session) {
          const levelsCount =
            Array.isArray(session.levelsCompleted) &&
            session.levelsCompleted.length > 0
              ? session.levelsCompleted.length
              : Math.max(0, (session.currentLevel || 1) - 1);

          let status = statusParam || session.status || "unknown";
          try {
            if (
              localStorage.getItem("cq_disqualified_" + session.userId) === "1"
            ) {
              status = "disqualified";
            }
          } catch {}

          setData({
            name: session.displayName || "Explorer",
            setId: session.setId ?? null,
            levels: levelsCount,
            fragments: session.fragments ?? 0,
            score: session.score ?? 0,
            wrongs: session.wrongAttempts ?? 0,
            status,
            keys: loadCollectedKeys(session.userId),
          });
          return;
        }
      } catch (e) {
        console.error(e);
      }

      // 3) Local fallback
      const user = getCurrentUser();
      if (user) {
        const progress = getUserProgress(user.id);
        setData({
          name: user.displayName,
          setId: progress?.setId ?? null,
          levels: progress?.levelsCompleted?.length ??
            Math.max(0, (progress?.currentLevel || 1) - 1),
          fragments: progress?.fragments ?? 0,
          score: progress?.score ?? 0,
          wrongs: progress?.wrongAttempts ?? 0,
          status:
            statusParam ||
            progress?.status ||
            "unknown",
          keys: loadCollectedKeys(user.id),
        });
        return;
      }

      setData({
        name: "Explorer",
        setId: null,
        levels: 0,
        fragments: 0,
        score: 0,
        wrongs: 0,
        status: statusParam || "unknown",
        keys: [],
      });
    })();
  }, [search]);

  // Block back into game when DQ
  useEffect(() => {
    if (!data || data.status !== "disqualified") return;
    window.history.pushState(null, "", window.location.href);
    const onPop = () => {
      window.history.pushState(null, "", window.location.href);
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [data]);

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
    <main className="sky-bg min-h-screen flex items-center justify-center px-4 py-10">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="quest-card max-w-md w-full p-8"
      >
        <h1
          className={`font-display text-3xl font-bold text-center mb-2 ${
            isDq ? "text-red-400" : isTimeout ? "text-amber-400" : "text-cyan-400"
          }`}
        >
          {isDq
            ? "DISQUALIFIED"
            : isTimeout
            ? "TIME UP"
            : "QUEST RESULT"}
        </h1>
        <p className="text-center text-slate-400 text-sm mb-6">
          {isDq
            ? "Anti-cheat triggered. This account cannot continue."
            : "Here is your run summary."}
        </p>

        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-400">Player</span>
            <span className="text-slate-100 font-medium">{data.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Question Set</span>
            <span className="text-cyan-300">
              {data.setId != null ? `#${data.setId}` : "—"}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Levels cleared</span>
            <span className="text-slate-100">{data.levels}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Keys / Fragments</span>
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
            <span>
              {data.levels >= 6 || data.fragments >= 6 || data.status === "completed"
                ? "✅ Found"
                : "❌ Not found"}
            </span>
          </div>
        </div>

        {data.keys.length > 0 && (
          <div className="mt-5">
            <p className="text-xs text-slate-500 mb-2 text-center">Keys collected</p>
            <div className="flex justify-center gap-2 flex-wrap">
              {LEVEL_KEYS.map((k) => {
                const got = data.keys.includes(k.id);
                return (
                  <div
                    key={k.id}
                    className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg border ${
                      got
                        ? `bg-gradient-to-br ${k.color} border-cyan-400/50`
                        : "bg-slate-900 border-slate-700 opacity-30"
                    }`}
                    title={got ? k.code : "—"}
                  >
                    {got ? k.symbol : "?"}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <button
          type="button"
          onClick={() => {
            try {
              sessionStorage.removeItem("cq_result_snapshot");
            } catch {}
            router.replace("/");
          }}
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
