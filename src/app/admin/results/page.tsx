"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase-auth";
import { getAllParticipantsForAdmin } from "@/lib/auth";

interface Result {
  id: string;
  name: string;
  setId: number | null;
  levelsCompleted: number;
  score: number;
  wrongAttempts: number;
  timePenalty: number;
  finalTime: string;
  masterKey: boolean;
  status: string;
  completedAt: string;
}

export default function ResultsPage() {
  const [results, setResults] = useState<Result[]>([]);
  const [source, setSource] = useState<"supabase" | "local">("local");

  useEffect(() => {
    (async () => {
      if (isSupabaseConfigured()) {
        try {
          const supabase = createClient();
          const { data: sessions } = await supabase
            .from("game_sessions")
            .select("*")
            .in("status", ["completed", "disqualified"]);

          if (sessions) {
            const ids = sessions.map((s: any) => s.user_id);
            const { data: profiles } = await supabase
              .from("profiles")
              .select("id, display_name")
              .in("id", ids.length ? ids : ["00000000-0000-0000-0000-000000000000"]);

            const names = new Map(
              (profiles || []).map((p: any) => [p.id, p.display_name])
            );

            setResults(
              sessions.map((s: any) => ({
                id: s.id,
                name: names.get(s.user_id) || "Explorer",
                setId: s.set_id,
                levelsCompleted: (s.levels_completed || []).length,
                score: s.score,
                wrongAttempts: s.wrong_attempts,
                timePenalty: s.time_penalty,
                finalTime: s.final_time != null ? String(s.final_time) : "—",
                masterKey: s.status === "completed",
                status: s.status,
                completedAt: s.completed_at
                  ? new Date(s.completed_at).toLocaleString()
                  : "—",
              }))
            );
            setSource("supabase");
            return;
          }
        } catch {}
      }

      const local = getAllParticipantsForAdmin()
        .filter((p) => p.status === "completed" || p.status === "disqualified")
        .map((p) => ({
          id: p.id,
          name: p.name,
          setId: p.setId,
          levelsCompleted: p.currentLevel > 0 ? Math.min(p.currentLevel, 6) : 0,
          score: p.score,
          wrongAttempts: p.wrongAttempts,
          timePenalty: 0,
          finalTime: "—",
          masterKey: p.status === "completed",
          status: p.status,
          completedAt: "—",
        }));
      setResults(local);
      setSource("local");
    })();
  }, []);

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <h1 className="font-cyber text-2xl text-cyan-400">Results</h1>
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

      {results.length === 0 ? (
        <div className="glass rounded-xl p-10 text-center text-slate-400">
          <p className="text-lg mb-2">No results yet</p>
          <p className="text-sm">Completed or disqualified players will appear here.</p>
        </div>
      ) : (
        <div className="glass rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700 text-slate-400 text-left">
                  <th className="px-4 py-3">Participant</th>
                  <th className="px-4 py-3">Set</th>
                  <th className="px-4 py-3">Levels</th>
                  <th className="px-4 py-3">Score</th>
                  <th className="px-4 py-3">Wrongs</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Master Key</th>
                  <th className="px-4 py-3">Completed</th>
                </tr>
              </thead>
              <tbody>
                {results.map((r) => (
                  <tr key={r.id} className="border-b border-slate-800 hover:bg-slate-800/40">
                    <td className="px-4 py-3 font-medium text-slate-200">{r.name}</td>
                    <td className="px-4 py-3">
                      {r.setId ? (
                        <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 text-xs">
                          #{r.setId}
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-4 py-3">{r.levelsCompleted}/6</td>
                    <td className="px-4 py-3 font-mono text-cyan-300">{r.score}</td>
                    <td className="px-4 py-3 text-red-400">{r.wrongAttempts}</td>
                    <td className="px-4 py-3 capitalize text-xs">{r.status}</td>
                    <td className="px-4 py-3">{r.masterKey ? "✅" : "❌"}</td>
                    <td className="px-4 py-3 text-xs text-slate-500">{r.completedAt}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
