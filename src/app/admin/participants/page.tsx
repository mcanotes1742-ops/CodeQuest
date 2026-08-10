"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { getAllParticipantsForAdmin } from "@/lib/auth";
import { getAvatarById } from "@/data/avatars";

type Row = {
  id: string;
  name: string;
  avatarId?: string | null;
  email: string;
  playMode: string;
  members: { name: string; email: string }[] | null;
  setId: number | null;
  status: string;
  currentLevel: number;
  score: number;
  fragments: number;
  wrongAttempts: number;
  joinedAt: string;
};

export default function ParticipantsPage() {
  const [list, setList] = useState<Row[]>([]);
  const [filter, setFilter] = useState("all");
  const [modeFilter, setModeFilter] = useState<"all" | "individual" | "team">("all");
  const [source, setSource] = useState<"supabase" | "local">("local");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function load() {
    setErrorMsg(null);
    try {
      const res = await fetch("/api/admin/participants");
      const data = await res.json();
      if (data.success && Array.isArray(data.rows)) {
        setList(data.rows);
        setSource("supabase");
        if (data.rows.length === 0) {
          setErrorMsg(null);
        }
        return;
      }
      setErrorMsg(data.error || "Could not load from Supabase");
    } catch (e: any) {
      setErrorMsg(e?.message || "Network error loading participants");
    }

    // Local fallback
    try {
      setList(getAllParticipantsForAdmin() as Row[]);
    } catch {
      setList([]);
    }
    setSource("local");
  }


  async function undiqualify(userId: string, name: string) {
    if (!confirm(`Allow "${name}" to play again from Level 1 with a NEW set?`)) return;
    try {
      const res = await fetch("/api/admin/undisqualify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      const data = await res.json();
      if (data.success) {
        alert(data.message + (data.newSet ? ` (Set #${data.newSet})` : ""));
        load();
      } else {
        alert(data.error || "Failed");
      }
    } catch (e: any) {
      alert(e?.message || "Failed");
    }
  }

  useEffect(() => {
    load();
    const interval = setInterval(load, 5000);
    return () => clearInterval(interval);
  }, []);

  const filtered = list.filter((p) => {
    if (filter !== "all" && p.status !== filter) return false;
    if (modeFilter !== "all" && p.playMode !== modeFilter) return false;
    return true;
  });

  const statusColor: Record<string, string> = {
    active: "text-emerald-400 bg-emerald-500/20",
    completed: "text-cyan-400 bg-cyan-500/20",
    disqualified: "text-red-400 bg-red-500/20",
    abandoned: "text-slate-400 bg-slate-500/20",
    not_started: "text-slate-400 bg-slate-600/30",
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <h1 className="font-cyber text-2xl text-cyan-400">Participants</h1>
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
        <div className="flex gap-2 flex-wrap">
          {["all", "active", "completed", "disqualified", "not_started"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs capitalize ${
                filter === f
                  ? "bg-cyan-500/30 text-cyan-300 border border-cyan-500/50"
                  : "bg-slate-800 text-slate-400"
              }`}
            >
              {f.replace("_", " ")}
            </button>
          ))}
        </div>
      </div>

      {errorMsg && (
        <div className="mb-4 rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {errorMsg}
          <p className="text-xs text-red-400/80 mt-1">
            Check SUPABASE_SERVICE_ROLE_KEY in .env.local and restart npm run dev
          </p>
        </div>
      )}

      <div className="flex gap-2 mb-4">
        {[
          { key: "all", label: "All Modes" },
          { key: "individual", label: "🧑‍💻 Individual" },
          { key: "team", label: "👥 Team of 2" },
        ].map((m) => (
          <button
            key={m.key}
            onClick={() => setModeFilter(m.key as typeof modeFilter)}
            className={`px-3 py-1.5 rounded-lg text-xs ${
              modeFilter === m.key
                ? "bg-purple-500/30 text-purple-300 border border-purple-500/50"
                : "bg-slate-800 text-slate-400"
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>

      {list.length === 0 ? (
        <div className="glass rounded-xl p-10 text-center text-slate-400">
          <p className="text-lg mb-2">No participants yet</p>
          <p className="text-sm">
            Users appear here after they <strong className="text-cyan-300">Register</strong> in
            the app. Login alone is not enough if they never registered into Supabase.
          </p>
          <p className="text-xs mt-3 text-slate-500">
            Check: Authentication → Users and Table Editor → profiles
          </p>
        </div>
      ) : (
        <div className="glass rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700 text-slate-400 text-left">
                  <th className="px-4 py-3 font-medium">Participant</th>
                  <th className="px-4 py-3 font-medium">Mode</th>
                  <th className="px-4 py-3 font-medium">Set</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Level</th>
                  <th className="px-4 py-3 font-medium">Score</th>
                  <th className="px-4 py-3 font-medium">Joined</th>
                  <th className="px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p, i) => (
                  <motion.tr
                    key={p.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.03 }}
                    className="border-b border-slate-800 hover:bg-slate-800/40"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-9 h-9 rounded-full bg-gradient-to-br ${getAvatarById(p.avatarId).bg} flex items-center justify-center text-lg shrink-0`}
                          title={getAvatarById(p.avatarId).label}
                        >
                          {getAvatarById(p.avatarId).emoji}
                        </span>
                        <div className="font-medium text-slate-200">{p.name}</div>
                      </div>
                      {p.playMode === "team" && p.members ? (
                        <div className="text-xs text-slate-500 mt-0.5 space-y-0.5">
                          {p.members.map((m, idx) => (
                            <div key={idx}>
                              {m.name} · {m.email}
                            </div>
                          ))}
                        </div>
                      ) : null}
                    </td>
                    <td className="px-4 py-3">
                      {p.playMode === "team" ? (
                        <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 text-xs">
                          👥 Team
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 text-xs">
                          🧑‍💻 Solo
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {p.setId ? (
                        <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 text-xs">
                          #{p.setId}
                        </span>
                      ) : (
                        <span className="text-slate-600">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-0.5 rounded text-xs capitalize ${
                          statusColor[p.status] || statusColor.not_started
                        }`}
                      >
                        {p.status.replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {p.currentLevel > 0 ? `${p.currentLevel}/6` : "—"}
                    </td>
                    <td className="px-4 py-3 font-mono">{p.score}</td>
                    <td className="px-4 py-3 text-slate-500 text-xs">
                      {p.joinedAt ? new Date(p.joinedAt).toLocaleString() : "—"}
                    </td>
                    <td className="px-4 py-3">
                      {p.status === "disqualified" && (
                        <button
                          onClick={() => undiqualify(p.id, p.name)}
                          className="text-xs px-2 py-1 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30"
                        >
                          Allow replay
                        </button>
                      )}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      <p className="text-xs text-slate-500 mt-3">
        Refreshes every 5s via service role API (bypasses RLS).
      </p>
    </div>
  );
}
