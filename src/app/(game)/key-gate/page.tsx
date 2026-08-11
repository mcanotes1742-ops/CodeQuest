"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { resolveSession } from "@/lib/session";
import {
  LEVEL_KEYS,
  buildFloatingPool,
  loadCollectedKeys,
  isKeysVerified,
  setKeysVerified,
  type KeyFragment,
} from "@/data/keys";

export default function KeyGatePage() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [collected, setCollected] = useState<string[]>([]);
  const [pool, setPool] = useState<KeyFragment[]>([]);
  const [picked, setPicked] = useState<string[]>([]);
  const [ready, setReady] = useState(false);
  const [wrongFlash, setWrongFlash] = useState(false);

  // Expected order: k1 → k2 → k3 → k4 → k5
  const expected = useMemo(() => LEVEL_KEYS.map((k) => k.id), []);

  useEffect(() => {
    (async () => {
      const session = await resolveSession();
      if (!session) {
        toast.error("Please login first");
        router.replace("/login");
        return;
      }
      // Must have finished level 5 (currentLevel >= 6)
      if ((session.currentLevel || 1) < 6) {
        toast.error("Complete levels 1–5 first");
        router.replace("/map");
        return;
      }
      if (isKeysVerified(session.userId)) {
        router.replace("/level/6");
        return;
      }
      const keys = loadCollectedKeys(session.userId);
      // Ensure all 5 real keys are present if they finished 5 levels
      const need = LEVEL_KEYS.map((k) => k.id);
      const merged = [...new Set([...keys, ...need])];
      setCollected(merged);
      setUserId(session.userId);
      setPool(buildFloatingPool());
      setReady(true);
    })();
  }, [router]);

  function onPick(key: KeyFragment) {
    if (picked.includes(key.id)) return;
    const nextIndex = picked.length;
    const expectedId = expected[nextIndex];

    if (key.id !== expectedId) {
      setWrongFlash(true);
      toast.error("Wrong key or wrong order! Remember the order you earned them.");
      setTimeout(() => {
        setWrongFlash(false);
        setPicked([]);
      }, 700);
      return;
    }

    const next = [...picked, key.id];
    setPicked(next);
    toast.success(`Key ${next.length}/5 locked: ${key.code}`);

    if (next.length === 5) {
      if (userId) setKeysVerified(userId, true);
      toast.success("All keys assembled! Master Vault unlocked.");
      setTimeout(() => router.push("/level/6"), 900);
    }
  }

  if (!ready) {
    return (
      <main className="sky-bg min-h-screen flex items-center justify-center">
        <p className="text-cyan-400 animate-pulse font-display">Loading vault gate...</p>
      </main>
    );
  }

  return (
    <main className="sky-bg min-h-screen py-8 px-4 overflow-hidden">
      <div className="max-w-4xl mx-auto text-center mb-6">
        <h1 className="font-display text-3xl md:text-4xl font-bold text-cyan-400 mb-2">
          🔑 KEY ASSEMBLY
        </h1>
        <p className="text-slate-300 mb-1">
          Before the <span className="text-amber-400 font-bold">Master Vault</span> opens,
          select your keys in the order you earned them.
        </p>
        <p className="text-sm text-slate-500">
          Order: Level 1 → 2 → 3 → 4 → 5 · Wrong pick resets the chain
        </p>
        <div className="mt-4 flex justify-center gap-2 flex-wrap">
          {expected.map((id, i) => {
            const done = picked.includes(id);
            const k = LEVEL_KEYS.find((x) => x.id === id)!;
            return (
              <div
                key={id}
                className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl border-2 ${
                  done
                    ? `bg-gradient-to-br ${k.color} border-cyan-300`
                    : "border-slate-600 bg-slate-900/60 opacity-40"
                }`}
              >
                {done ? k.symbol : i + 1}
              </div>
            );
          })}
        </div>
        <p className="mt-2 font-mono text-cyan-300">
          {picked.length} / 5 assembled
        </p>
      </div>

      <div
        className={`relative max-w-5xl mx-auto min-h-[420px] rounded-2xl border border-cyan-500/20 bg-slate-950/50 p-4 ${
          wrongFlash ? "ring-2 ring-red-500" : ""
        }`}
      >
        {pool.map((key, i) => {
          const used = picked.includes(key.id);
          // scatter positions
          const top = 8 + ((i * 37) % 70);
          const left = 5 + ((i * 53) % 80);
          const delay = (i % 6) * 0.15;
          return (
            <motion.button
              key={key.id + "-" + i}
              type="button"
              disabled={used}
              onClick={() => onPick(key)}
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{
                opacity: used ? 0.25 : 1,
                scale: used ? 0.7 : 1,
                y: [0, -12, 0, 8, 0],
                x: [0, 6, 0, -6, 0],
              }}
              transition={{
                y: { duration: 3 + (i % 3), repeat: Infinity, ease: "easeInOut", delay },
                x: { duration: 4 + (i % 4), repeat: Infinity, ease: "easeInOut", delay },
                opacity: { duration: 0.3 },
              }}
              style={{ top: `${top}%`, left: `${left}%` }}
              className={`absolute w-20 h-20 md:w-24 md:h-24 rounded-2xl flex flex-col items-center justify-center gap-0.5
                bg-gradient-to-br ${key.color} shadow-lg border border-white/10
                hover:scale-110 active:scale-95 transition-transform cursor-pointer
                ${used ? "pointer-events-none grayscale" : ""}`}
            >
              <span className="text-2xl md:text-3xl">{key.symbol}</span>
              <span className="text-[10px] font-mono font-bold text-white/90 tracking-wider">
                {key.code}
              </span>
            </motion.button>
          );
        })}
      </div>

      <div className="text-center mt-8">
        <button
          type="button"
          onClick={() => router.push("/map")}
          className="text-sm text-slate-500 underline hover:text-cyan-400"
        >
          Back to map
        </button>
      </div>
    </main>
  );
}
