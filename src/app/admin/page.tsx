"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { getAllParticipantsForAdmin } from "@/lib/auth";

interface Stats {
  totalParticipants: number;
  activeNow: number;
  completed: number;
  disqualified: number;
  avgScore: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats>({
    totalParticipants: 0,
    activeNow: 0,
    completed: 0,
    disqualified: 0,
    avgScore: 0,
  });
  const [settingsPreview, setSettingsPreview] = useState({
    startingTimer: "30:00",
    wrongPenalty: "-30s",
    memoryDuration: "20s",
    gameActive: true,
    allowReplay: false,
    allowDisqualifiedReplay: false,
  });

  useEffect(() => {
    // Local participants stats
    const list = getAllParticipantsForAdmin();
    const active = list.filter((p) => p.status === "active").length;
    const completed = list.filter((p) => p.status === "completed").length;
    const disqualified = list.filter((p) => p.status === "disqualified").length;
    const scores = list.filter((p) => p.score > 0).map((p) => p.score);
    const avg = scores.length
      ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
      : 0;

    setStats({
      totalParticipants: list.length,
      activeNow: active,
      completed,
      disqualified,
      avgScore: avg,
    });

    // Settings from local or supabase
    try {
      const raw = localStorage.getItem("cq_game_settings");
      if (raw) {
        const s = JSON.parse(raw);
        const t = s.startingTimer ?? 1800;
        setSettingsPreview({
          startingTimer: `${Math.floor(t / 60)}:${String(t % 60).padStart(2, "0")}`,
          wrongPenalty: `-${s.wrongPenalty ?? 30}s`,
          memoryDuration: `${s.memoryDuration ?? 20}s`,
          gameActive: s.gameActive ?? true,
          allowReplay: s.allowReplay ?? false,
          allowDisqualifiedReplay: s.allowDisqualifiedReplay ?? false,
        });
      }
    } catch {}

    // Try Supabase for live counts
    (async () => {
      try {
        const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
        if (!url || url.includes("your-project")) return;
        const supabase = createClient();
        const { data: sessions } = await supabase.from("game_sessions").select("status, score");
        if (sessions && sessions.length > 0) {
          setStats({
            totalParticipants: sessions.length,
            activeNow: sessions.filter((s: any) => s.status === "active").length,
            completed: sessions.filter((s: any) => s.status === "completed").length,
            disqualified: sessions.filter((s: any) => s.status === "disqualified").length,
            avgScore: Math.round(
              sessions.reduce((a: number, s: any) => a + (s.score || 0), 0) /
                sessions.length
            ),
          });
        }
        const { data: gs } = await supabase
          .from("game_settings")
          .select("*")
          .eq("id", 1)
          .single();
        if (gs) {
          const t = gs.starting_timer ?? 1800;
          setSettingsPreview({
            startingTimer: `${Math.floor(t / 60)}:${String(t % 60).padStart(2, "0")}`,
            wrongPenalty: `-${gs.wrong_answer_penalty ?? 30}s`,
            memoryDuration: `${gs.memory_duration ?? 20}s`,
            gameActive: gs.game_active ?? true,
            allowReplay: gs.allow_replay ?? false,
            allowDisqualifiedReplay: gs.allow_disqualified_replay ?? false,
          });
        }
      } catch {}
    })();
  }, []);

  const cards = [
    { label: "Total Participants", value: stats.totalParticipants, color: "from-cyan-500 to-blue-600" },
    { label: "Active Now", value: stats.activeNow, color: "from-emerald-500 to-green-600" },
    { label: "Completed", value: stats.completed, color: "from-purple-500 to-violet-600" },
    { label: "Disqualified", value: stats.disqualified, color: "from-red-500 to-rose-600" },
    { label: "Avg Score", value: stats.avgScore, color: "from-amber-500 to-orange-600" },
  ];

  return (
    <div>
      <h1 className="font-cyber text-2xl text-cyan-400 neon-text mb-6">Dashboard</h1>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {cards.map((c, i) => (
          <motion.div
            key={c.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="glass rounded-xl p-5 relative overflow-hidden"
          >
            <div className={`absolute inset-0 bg-gradient-to-br ${c.color} opacity-10`} />
            <p className="text-slate-400 text-sm relative z-10">{c.label}</p>
            <p className="text-3xl font-bold text-white mt-1 relative z-10">{c.value}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="glass rounded-xl p-5">
          <h2 className="font-semibold text-cyan-300 mb-4">Quick Actions</h2>
          <div className="space-y-2">
            <a href="/admin/settings" className="block px-4 py-3 rounded-lg bg-slate-800/60 hover:bg-slate-800 text-sm">
              ⚙️ Configure Timer, Penalties & Disqualified Replay
            </a>
            <a href="/admin/live" className="block px-4 py-3 rounded-lg bg-slate-800/60 hover:bg-slate-800 text-sm">
              📡 View Live Progress
            </a>
            <a href="/admin/leaderboard" className="block px-4 py-3 rounded-lg bg-slate-800/60 hover:bg-slate-800 text-sm">
              🏆 Open Leaderboard
            </a>
            <a href="/admin/sets" className="block px-4 py-3 rounded-lg bg-slate-800/60 hover:bg-slate-800 text-sm">
              📦 Manage Question Sets
            </a>
          </div>
        </div>

        <div className="glass rounded-xl p-5">
          <h2 className="font-semibold text-cyan-300 mb-4">System Status</h2>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-400">Game Active</span>
              <span className={settingsPreview.gameActive ? "text-emerald-400 font-medium" : "text-red-400"}>
                {settingsPreview.gameActive ? "● Online" : "○ Offline"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Starting Timer</span>
              <span>{settingsPreview.startingTimer}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Wrong Penalty</span>
              <span>{settingsPreview.wrongPenalty}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Memory Duration</span>
              <span>{settingsPreview.memoryDuration}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Replay (Completed)</span>
              <span className={settingsPreview.allowReplay ? "text-emerald-400" : "text-red-400"}>
                {settingsPreview.allowReplay ? "Yes" : "No"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Disqualified Replay</span>
              <span className={settingsPreview.allowDisqualifiedReplay ? "text-amber-400" : "text-red-400"}>
                {settingsPreview.allowDisqualifiedReplay ? "Allowed" : "Blocked"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
