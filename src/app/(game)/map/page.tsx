"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { resolveSession } from "@/lib/session";
import { getAvatarById, getLocalAvatarId } from "@/data/avatars";
import { toast } from "sonner";

const LEVELS = [
  { id: 1, name: "CODE RIDDLE", color: "from-emerald-400 to-green-600", ring: "ring-emerald-300", icon: "📜" },
  { id: 2, name: "OUTPUT HUNT", color: "from-violet-400 to-purple-700", ring: "ring-violet-300", icon: "🔮" },
  { id: 3, name: "CODE DETECTIVE", color: "from-sky-400 to-blue-700", ring: "ring-sky-300", icon: "🕵️" },
  { id: 4, name: "LOGIC LOCK", color: "from-orange-400 to-amber-600", ring: "ring-orange-300", icon: "🔐" },
  { id: 5, name: "ARRANGEMENT", color: "from-pink-400 to-rose-600", ring: "ring-pink-300", icon: "🧩" },
  { id: 6, name: "MASTER VAULT", color: "from-yellow-300 to-amber-500", ring: "ring-yellow-200", icon: "🏰" },
];

export default function MapPage() {
  const router = useRouter();
  const [currentLevel, setCurrentLevel] = useState(1);
  const [fragments, setFragments] = useState(0);
  const [userName, setUserName] = useState("Explorer");
  const [userId, setUserId] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [avatarId, setAvatarId] = useState<string>("explorer");


  useEffect(() => {
    (async () => {
      const session = await resolveSession();
      if (!session) {
        toast.error("Please login first");
        router.replace("/login");
        return;
      }
      if (session.status === "disqualified") {
        router.replace("/result?status=disqualified");
        return;
      }
      if (session.status === "completed") {
        router.replace("/victory");
        return;
      }
      setUserName(session.displayName);
      setUserId(session.userId);
      setAvatarId(session.avatarId || getLocalAvatarId(session.userId) || "explorer");
      setCurrentLevel(session.currentLevel || 1);
      setFragments(session.fragments || 0);
      setReady(true);
    })();
  }, [router]);

  if (!ready) {
    return (
      <main className="sky-bg min-h-screen flex items-center justify-center">
        <p className="font-display text-cyan-400 text-xl animate-pulse">Loading map...</p>
      </main>
    );
  }

  return (
    <main className="sky-bg min-h-screen py-6 px-4 pb-16">
      {/* HUD */}
      <div className="max-w-4xl mx-auto mb-8 quest-card p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            className={`w-12 h-12 rounded-full bg-gradient-to-br ${getAvatarById(avatarId).bg} border-2 border-cyan-300/80 shadow flex items-center justify-center text-2xl overflow-hidden`}
            title={getAvatarById(avatarId).label}
          >
            {getAvatarById(avatarId).emoji}
          </div>
          <div>
            <p className="font-display font-bold text-cyan-300 text-lg">{userName}</p>
            <p className="text-xs text-slate-400 font-semibold">
              Exploring island {Math.min(currentLevel, 6)} of 6
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 bg-amber-950/40 border border-amber-500/40 rounded-full px-4 py-2">
          <span className="text-xl">💎</span>
          <span className="font-bold text-amber-400">
            {Math.min(fragments, 5)} / 5 Fragments
          </span>
        </div>
      </div>

      <h1 className="font-display text-3xl md:text-4xl text-center text-cyan-300 font-bold mb-1">
        Treasure Map
      </h1>
      <p className="text-center text-slate-400 text-sm mb-10 font-medium">
        Clear each island to unlock the path to the Master Vault
      </p>

      {/* Path of islands */}
      <div className="max-w-5xl mx-auto">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 md:gap-6">
          {LEVELS.map((lvl, idx) => {
            const unlocked = lvl.id <= currentLevel;
            const completed = lvl.id < currentLevel;
            const current = lvl.id === currentLevel;
            return (
              <motion.div
                key={lvl.id}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.07 }}
                className="flex flex-col items-center"
              >
                <button
                  type="button"
                  disabled={!unlocked}
                  onClick={() => unlocked && router.push(`/level/${lvl.id}`)}
                  className={`
                    relative w-full aspect-square max-w-[140px] rounded-[1.75rem]
                    bg-gradient-to-br ${lvl.color}
                    shadow-lg transition-all duration-75
                    ${unlocked ? "hover:scale-105 hover:shadow-xl active:scale-95 cursor-pointer" : "opacity-50 cursor-not-allowed grayscale"}
                    ${current ? `ring-4 ${lvl.ring} ring-offset-2 ring-offset-[#0a0e1a]` : ""}
                    ${completed ? "ring-4 ring-emerald-400 ring-offset-2" : ""}
                  `}
                >
                  <div className="absolute inset-0 rounded-[1.75rem] bg-gradient-to-t from-black/25 to-transparent" />
                  <div className="relative h-full flex flex-col items-center justify-center text-white p-2">
                    {completed ? (
                      <span className="text-4xl drop-shadow-md">✓</span>
                    ) : (
                      <span className="text-3xl drop-shadow-md">{lvl.icon}</span>
                    )}
                    <span className="mt-1 text-xs font-extrabold drop-shadow">
                      {lvl.id}
                    </span>
                  </div>
                  {!unlocked && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-[1.75rem]">
                      <span className="text-2xl">🔒</span>
                    </div>
                  )}
                </button>
                <p className={`mt-2 text-center text-[11px] font-bold leading-tight px-1 ${
                  unlocked ? "text-cyan-300" : "text-slate-400"
                }`}>
                  {lvl.name}
                </p>
                {idx < LEVELS.length - 1 && (
                  <div className="hidden lg:block absolute" />
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="mt-10 flex flex-wrap justify-center gap-4 text-xs font-semibold text-slate-400">
          <span className="flex items-center gap-1.5 bg-slate-900/80 px-3 py-1.5 rounded-full border border-cyan-500/20">
            <span className="w-3 h-3 rounded-full bg-emerald-400" /> Completed
          </span>
          <span className="flex items-center gap-1.5 bg-slate-900/80 px-3 py-1.5 rounded-full border border-cyan-500/20">
            <span className="w-3 h-3 rounded-full bg-sky-400 ring-2 ring-sky-200" /> Current
          </span>
          <span className="flex items-center gap-1.5 bg-slate-900/80 px-3 py-1.5 rounded-full border border-cyan-500/20">
            🔒 Locked
          </span>
        </div>
      </div>
    </main>
  );
}
