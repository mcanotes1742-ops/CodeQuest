"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

interface LiveSession {
  id: string;
  name: string;
  setId: number;
  currentLevel: number;
  fragments: number;
  wrongAttempts: number;
  lastActive: string;
}

export default function LiveProgressPage() {
  const [sessions, setSessions] = useState<LiveSession[]>([]);

  async function load() {
    try {
      const res = await fetch("/api/admin/live");
      const data = await res.json();
      if (data.success) setSessions(data.rows || []);
    } catch {}
  }

  useEffect(() => {
    load();
    const t = setInterval(load, 4000);
    return () => clearInterval(t);
  }, []);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-cyber text-2xl text-cyan-400">Live Progress</h1>
        <div className="flex items-center gap-2 text-sm">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-emerald-400">{sessions.length} active</span>
        </div>
      </div>

      {sessions.length === 0 ? (
        <div className="glass rounded-xl p-10 text-center text-slate-400">
          <p className="text-lg mb-2">No active players</p>
          <p className="text-sm">When users login and start a quest, they appear here.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {sessions.map((s, i) => (
            <motion.div
              key={s.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="glass rounded-xl p-4 flex flex-wrap items-center gap-4"
            >
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-400 to-purple-600 flex items-center justify-center text-sm font-bold">
                {s.name.charAt(0)}
              </div>
              <div className="flex-1 min-w-[140px]">
                <p className="font-medium text-slate-200">{s.name}</p>
                <p className="text-xs text-slate-500">
                  Set #{s.setId} · {s.lastActive}
                </p>
              </div>
              <div className="text-center">
                <p className="text-xs text-slate-500">Level</p>
                <p className="font-mono text-cyan-300">{s.currentLevel}/6</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-slate-500">Fragments</p>
                <p className="font-mono text-amber-400">{s.fragments}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-slate-500">Wrongs</p>
                <p className="font-mono text-red-400">{s.wrongAttempts}</p>
              </div>
              <div className="w-full md:w-32">
                <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-cyan-500 to-purple-500 rounded-full"
                    style={{ width: `${(s.currentLevel / 6) * 100}%` }}
                  />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
