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

      const buildFrom = (
        base: {
          name?: string;
          setId?: number | null;
          levels?: number;
          fragments?: number;
          score?: number;
          wrongs?: number;
          status?: string;
          userId?: string;
          currentLevel?: number;
          levelsCompleted?: number[];
        },
        keys: string[]
      ) => {
        let levels =
          base.levels ??
          (Array.isArray(base.levelsCompleted) && base.levelsCompleted.length > 0
            ? base.levelsCompleted.length
            : Math.max(0, (base.currentLevel || 1) - 1));
        let fragments = base.fragments ?? 0;
        let score = base.score ?? 0;
        // If progress numbers are still 0 but keys were collected, derive from keys
        if ((levels === 0 && fragments === 0 && score === 0) && keys.length > 0) {
          levels = keys.length;
          fragments = keys.length;
          score = keys.length * 15;
        }
        return {
          name: base.name || "Explorer",
          setId: base.setId ?? null,
          levels,
          fragments,
          score,
          wrongs: base.wrongs ?? 0,
          status: statusParam || base.status || "unknown",
          keys,
        };
      };

      // 1) Snapshot saved at DQ time
      try {
        const snapRaw = sessionStorage.getItem("cq_result_snapshot");
        if (snapRaw) {
          const snap = JSON.parse(snapRaw);
          const keys = snap.userId ? loadCollectedKeys(snap.userId) : [];
          const built = buildFrom(
            {
              name: snap.name,
              setId: snap.setId,
              levelsCompleted: snap.levelsCompleted,
              currentLevel: snap.currentLevel,
              fragments: snap.fragments,
              score: snap.score,
              wrongs: snap.wrongAttempts,
              status: snap.status || "disqualified",
              userId: snap.userId,
            },
            keys
          );
          // If snapshot still empty, try merge with live session / local progress
          if (built.levels === 0 && built.fragments === 0 && keys.length === 0) {
            // fall through
          } else {
            // Also try to enrich from local progress / session if snapshot was partial
            try {
              const progress = snap.userId ? getUserProgress(snap.userId) : null;
              if (progress && (progress.fragments > built.fragments || progress.score > built.score)) {
                built.levels = Math.max(
                  built.levels,
                  progress.levelsCompleted?.length ?? 0,
                  Math.max(0, (progress.currentLevel || 1) - 1)
                );
                built.fragments = Math.max(built.fragments, progress.fragments ?? 0);
                built.score = Math.max(built.score, progress.score ?? 0);
                built.wrongs = Math.max(built.wrongs, progress.wrongAttempts ?? 0);
              }
            } catch {}
            setData(built);
            return;
          }
        }
      } catch {}

      // 2) resolveSession
      try {
        const session = await resolveSession();
        if (session) {
          let status = statusParam || session.status || "unknown";
          try {
            if (localStorage.getItem("cq_disqualified_" + session.userId) === "1") {
              status = "disqualified";
            }
          } catch {}
          const keys = loadCollectedKeys(session.userId);
          setData(
            buildFrom(
              {
                name: session.displayName,
                setId: session.setId,
                levelsCompleted: session.levelsCompleted,
                currentLevel: session.currentLevel,
                fragments: session.fragments,
                score: session.score,
                wrongs: session.wrongAttempts,
                status,
                userId: session.userId,
              },
              keys
            )
          );
          return;
        }
      } catch (e) {
        console.error(e);
      }

      // 3) Local fallback
      const user = getCurrentUser();
      if (user) {
        const progress = getUserProgress(user.id);
        const keys = loadCollectedKeys(user.id);
        setData(
          buildFrom(
            {
              name: user.displayName,
              setId: progress?.setId,
              levelsCompleted: progress?.levelsCompleted,
              currentLevel: progress?.currentLevel,
              fragments: progress?.fragments,
              score: progress?.score,
              wrongs: progress?.wrongAttempts,
              status: progress?.status,
              userId: user.id,
            },
            keys
          )
        );
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
