"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { getKeyForLevel, loadCollectedKeys, LEVEL_KEYS } from "@/data/keys";
import { resolveSession } from "@/lib/session";

function KeyRewardContent() {
  const router = useRouter();
  const search = useSearchParams();
  const level = parseInt(search.get("level") || "1", 10);
  const key = getKeyForLevel(level);
  const [collected, setCollected] = useState<string[]>([]);

  useEffect(() => {
    (async () => {
      const session = await resolveSession();
      if (session) setCollected(loadCollectedKeys(session.userId));
    })();
  }, []);

  if (!key) {
    return (
      <main className="sky-bg min-h-screen flex items-center justify-center">
        <button onClick={() => router.push("/map")} className="btn-adventure px-6 py-3">
          Back to map
        </button>
      </main>
    );
  }

  return (
    <main className="sky-bg min-h-screen flex items-center justify-center px-4 py-10">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        className="quest-card max-w-lg w-full p-8 md:p-10 text-center"
      >
        <motion.p
          initial={{ scale: 0.5 }}
          animate={{ scale: 1 }}
          className="text-sm font-bold tracking-[0.3em] text-emerald-400 mb-3"
        >
          CONGRATULATIONS
        </motion.p>
        <h1 className="font-display text-3xl md:text-4xl font-bold text-cyan-300 mb-2">
          Level {level} Cleared!
        </h1>
        <p className="text-slate-400 mb-8">You earned a vault key. Remember it.</p>

        <motion.div
          initial={{ rotate: -20, scale: 0.6 }}
          animate={{ rotate: 0, scale: 1 }}
          transition={{ type: "spring", stiffness: 200 }}
          className={`mx-auto w-32 h-32 rounded-3xl flex flex-col items-center justify-center bg-gradient-to-br ${key.color} shadow-2xl border border-white/20 mb-5`}
        >
          <span className="text-5xl">{key.symbol}</span>
          <span className="mt-1 text-xs font-mono font-bold text-white tracking-widest">
            {key.code}
          </span>
        </motion.div>

        <h2 className="font-display text-2xl text-amber-300 font-bold mb-1">
          {key.label}
        </h2>
        <p className="font-mono text-4xl text-cyan-300 tracking-[0.25em] mb-4">
          {key.code}
        </p>
        <p className="text-slate-400 text-sm mb-8 max-w-sm mx-auto">
          Keep this code in mind. After level 5 you must pick all five keys in order
          to open the Master Vault.
        </p>

        {/* Progress of all keys */}
        <div className="flex justify-center gap-2 mb-8">
          {LEVEL_KEYS.map((k) => {
            const got = collected.includes(k.id) || k.level === level;
            return (
              <div
                key={k.id}
                className={`w-11 h-11 rounded-xl flex items-center justify-center text-lg border-2 ${
                  got
                    ? `bg-gradient-to-br ${k.color} border-cyan-300`
                    : "bg-slate-900 border-slate-700 opacity-35"
                }`}
                title={got ? k.code : `Level ${k.level}`}
              >
                {got ? k.symbol : k.level}
              </div>
            );
          })}
        </div>

        <button
          type="button"
          onClick={() => {
            if (level >= 5) router.push("/key-gate");
            else router.push("/map");
          }}
          className="btn-adventure w-full py-3.5 text-base font-bold"
        >
          {level >= 5 ? "ASSEMBLE KEYS →" : "GO AHEAD → MAP"}
        </button>
      </motion.div>
    </main>
  );
}

export default function KeyRewardPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center text-cyan-400">
          Loading...
        </div>
      }
    >
      <KeyRewardContent />
    </Suspense>
  );
}
