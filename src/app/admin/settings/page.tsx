"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";

interface GameSettings {
  startingTimer: number;
  wrongPenalty: number;
  memoryDuration: number;
  gameActive: boolean;
  allowReplay: boolean;
  leaderboardVisible: boolean;
  allowDisqualifiedReplay: boolean;
}

const DEFAULTS: GameSettings = {
  startingTimer: 1800,
  wrongPenalty: 30,
  memoryDuration: 20,
  gameActive: true,
  allowReplay: false,
  leaderboardVisible: true,
  allowDisqualifiedReplay: false,
};

const LOCAL_KEY = "cq_game_settings";

export default function SettingsPage() {
  const [settings, setSettings] = useState<GameSettings>(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [source, setSource] = useState<"supabase" | "local">("local");

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    setLoading(true);
    try {
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      if (url && key && !url.includes("your-project")) {
        const supabase = createClient();
        const { data, error } = await supabase
          .from("game_settings")
          .select("*")
          .eq("id", 1)
          .single();

        if (!error && data) {
          setSettings({
            startingTimer: data.starting_timer ?? 1800,
            wrongPenalty: data.wrong_answer_penalty ?? 30,
            memoryDuration: data.memory_duration ?? 20,
            gameActive: data.game_active ?? true,
            allowReplay: data.allow_replay ?? false,
            leaderboardVisible: data.leaderboard_visible ?? true,
            allowDisqualifiedReplay: data.allow_disqualified_replay ?? false,
          });
          setSource("supabase");
          setLoading(false);
          return;
        }
      }
    } catch {
      // fall through to local
    }

    // Fallback: localStorage
    try {
      const raw = localStorage.getItem(LOCAL_KEY);
      if (raw) setSettings({ ...DEFAULTS, ...JSON.parse(raw) });
    } catch {}
    setSource("local");
    setLoading(false);
  }

  const handleSave = async () => {
    setSaving(true);
    try {
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      if (url && key && !url.includes("your-project")) {
        const supabase = createClient();
        const { error } = await supabase
          .from("game_settings")
          .update({
            starting_timer: settings.startingTimer,
            wrong_answer_penalty: settings.wrongPenalty,
            memory_duration: settings.memoryDuration,
            game_active: settings.gameActive,
            allow_replay: settings.allowReplay,
            leaderboard_visible: settings.leaderboardVisible,
            allow_disqualified_replay: settings.allowDisqualifiedReplay,
            updated_at: new Date().toISOString(),
          })
          .eq("id", 1);

        if (error) {
          // Still save locally
          localStorage.setItem(LOCAL_KEY, JSON.stringify(settings));
          toast.error("Supabase save failed: " + error.message + " (saved locally)");
        } else {
          localStorage.setItem(LOCAL_KEY, JSON.stringify(settings));
          toast.success("Settings saved to Supabase!");
          setSource("supabase");
        }
      } else {
        localStorage.setItem(LOCAL_KEY, JSON.stringify(settings));
        toast.success("Settings saved locally (configure Supabase env for DB storage)");
        setSource("local");
      }
    } catch (e: any) {
      localStorage.setItem(LOCAL_KEY, JSON.stringify(settings));
      toast.error("Save error – stored locally");
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="text-cyan-400 font-cyber animate-pulse">Loading settings...</div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-2">
        <h1 className="font-cyber text-2xl text-cyan-400">Game Settings</h1>
        <span
          className={`text-xs px-2 py-1 rounded ${
            source === "supabase"
              ? "bg-emerald-500/20 text-emerald-400"
              : "bg-amber-500/20 text-amber-400"
          }`}
        >
          {source === "supabase" ? "● Synced with Supabase" : "○ Local only"}
        </span>
      </div>

      <div className="glass rounded-xl p-6 max-w-xl space-y-6">
        {/* Starting Timer */}
        <div>
          <label className="block text-sm text-slate-300 mb-2">
            Starting Timer (seconds)
          </label>
          <input
            type="number"
            min={300}
            max={7200}
            value={settings.startingTimer}
            onChange={(e) =>
              setSettings({ ...settings, startingTimer: parseInt(e.target.value) || 1800 })
            }
            className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-2.5 focus:border-cyan-400 outline-none"
          />
          <p className="text-xs text-slate-500 mt-1">
            Current: {Math.floor(settings.startingTimer / 60)} min{" "}
            {settings.startingTimer % 60}s
          </p>
        </div>

        {/* Wrong Answer Penalty */}
        <div>
          <label className="block text-sm text-slate-300 mb-2">
            Wrong Answer Penalty (seconds)
          </label>
          <input
            type="number"
            min={0}
            max={300}
            value={settings.wrongPenalty}
            onChange={(e) =>
              setSettings({ ...settings, wrongPenalty: parseInt(e.target.value) || 30 })
            }
            className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-2.5 focus:border-cyan-400 outline-none"
          />
        </div>

        {/* Memory Duration */}
        <div>
          <label className="block text-sm text-slate-300 mb-2">
            Memory Challenge Duration
          </label>
          <div className="flex gap-3">
            {[20, 30, 50].map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setSettings({ ...settings, memoryDuration: d })}
                className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  settings.memoryDuration === d
                    ? "bg-cyan-500/30 text-cyan-300 border border-cyan-500/50"
                    : "bg-slate-800 text-slate-400 border border-transparent"
                }`}
              >
                {d}s
              </button>
            ))}
          </div>
        </div>

        {/* Toggles */}
        <div className="space-y-4 pt-2 border-t border-slate-700">
          {[
            {
              key: "gameActive" as const,
              label: "Game Active",
              desc: "Players can start new quests",
            },
            {
              key: "allowReplay" as const,
              label: "Allow Replay (Completed)",
              desc: "Players who finished can play again",
            },
            {
              key: "allowDisqualifiedReplay" as const,
              label: "Allow Disqualified Replay",
              desc: "If ON, disqualified users can login and play again. If OFF, they are permanently blocked.",
            },
            {
              key: "leaderboardVisible" as const,
              label: "Leaderboard Visible",
              desc: "Show public leaderboard to players",
            },
          ].map((t) => (
            <div key={t.key} className="flex items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="text-slate-200 text-sm">{t.label}</p>
                <p className="text-xs text-slate-500">{t.desc}</p>
              </div>
              <button
                type="button"
                onClick={() =>
                  setSettings({
                    ...settings,
                    [t.key]: !settings[t.key],
                  })
                }
                className={`w-12 h-6 rounded-full transition-colors relative shrink-0 ${
                  settings[t.key] ? "bg-cyan-500" : "bg-slate-600"
                }`}
              >
                <span
                  className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
                    settings[t.key] ? "left-6" : "left-0.5"
                  }`}
                />
              </button>
            </div>
          ))}
        </div>

        {/* Highlight for disqualified control */}
        <div
          className={`rounded-xl p-4 border ${
            settings.allowDisqualifiedReplay
              ? "border-amber-500/50 bg-amber-500/10"
              : "border-red-500/40 bg-red-500/10"
          }`}
        >
          <p className="text-sm font-medium text-slate-200 mb-1">
            Disqualified players policy
          </p>
          <p className="text-xs text-slate-400">
            {settings.allowDisqualifiedReplay
              ? "⚠️ Currently ALLOWED to play again after disqualification."
              : "🔒 Currently BLOCKED permanently after disqualification."}
          </p>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="btn-cyber w-full py-3 rounded-xl text-white font-bold disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save Settings"}
        </button>
      </div>
    </div>
  );
}
