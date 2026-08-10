"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { getSetById } from "@/data/questions";
import { useAntiCheat } from "@/hooks/useAntiCheat";
import { formatTime, shuffleArray } from "@/lib/utils";
import {
  getCurrentUser,
  getUserProgress,
  updateProgress,
  disqualifyUser,
} from "@/lib/auth";
import { isSupabaseConfigured, supabaseDisqualify, supabaseUpdateProgress } from "@/lib/supabase-auth";
import { resolveSession } from "@/lib/session";

export default function LevelPage() {
  const params = useParams();
  const router = useRouter();
  const levelId = parseInt(params.levelId as string, 10);

  const [userId, setUserId] = useState<string | null>(null);
  const [setId, setSetId] = useState(1);
  const [answer, setAnswer] = useState("");
  const [timer, setTimer] = useState(1800);
  const [loading, setLoading] = useState(false);
  const [shuffledLines, setShuffledLines] = useState<string[]>([]);
  const [arranged, setArranged] = useState<string[]>([]);
  const [memoryPhase, setMemoryPhase] = useState<"warning" | "show" | "question">("warning");
  const [memoryTimer, setMemoryTimer] = useState(20);
  const [lockAnswers, setLockAnswers] = useState<Record<number, string>>({});
  // Continuous whole-game timer: base duration + start time + accumulated penalty
  const [gameStartMs, setGameStartMs] = useState<number | null>(null);
  const [timePenaltySec, setTimePenaltySec] = useState(0);
  const [baseDurationSec, setBaseDurationSec] = useState(1800);

  // Anti-cheat only while playing a level (not on login / avatar / map)
  useAntiCheat({
    enabled: !!userId && !!levelId,
    onDisqualify: async () => {
      if (userId) disqualifyUser(userId);
      if (isSupabaseConfigured()) {
        try {
          await supabaseDisqualify();
        } catch (e) {
          console.error(e);
        }
      }
    },
  });

  /** Remaining seconds = baseDuration - wall-clock elapsed - penalties */
  function computeRemaining(startMs: number, penalty: number, base: number) {
    const elapsed = Math.floor((Date.now() - startMs) / 1000);
    return Math.max(0, base - elapsed - penalty);
  }

  useEffect(() => {
    (async () => {
      const session = await resolveSession();
      if (!session) {
        toast.error("Please login first");
        router.replace("/login");
        return;
      }
      setUserId(session.userId);

      let blocked = session.status === "disqualified";
      try {
        if (localStorage.getItem("cq_disqualified_" + session.userId) === "1") blocked = true;
      } catch {}
      if (blocked) {
        router.replace("/result?status=disqualified");
        return;
      }
      if (levelId > session.currentLevel) {
        toast.error("Level locked");
        router.replace("/map");
        return;
      }

      setSetId(session.setId || 1);

      // Resolve starting timer from admin settings (default 30 min)
      let base = 1800;
      try {
        const raw = localStorage.getItem("cq_game_settings");
        if (raw) {
          const s = JSON.parse(raw);
          if (typeof s.startingTimer === "number" && s.startingTimer > 0) base = s.startingTimer;
        }
      } catch {}
      setBaseDurationSec(base);

      const penalty = session.timePenalty || 0;
      setTimePenaltySec(penalty);

      // Prefer DB started_at so timer is continuous across all levels & Back button
      let startMs: number;
      if (session.startedAt) {
        startMs = new Date(session.startedAt).getTime();
      } else {
        // Fallback: ensure a start time exists so timer doesn't reset per level
        startMs = Date.now();
        try {
          if (userId || session.userId) {
            const uid = session.userId;
            if (isSupabaseConfigured()) {
              // best-effort; start route already sets started_at for new sessions
            } else {
              const p = getUserProgress(uid);
              if (p && !p.startedAt) {
                updateProgress(uid, { startedAt: new Date(startMs).toISOString() });
              } else if (p?.startedAt) {
                startMs = new Date(p.startedAt).getTime();
              }
            }
          }
        } catch {}
      }
      setGameStartMs(startMs);
      setTimer(computeRemaining(startMs, penalty, base));
    })();
  }, [router, levelId]);

  // Tick every second from wall clock so Back / remount never resets the shared timer
  useEffect(() => {
    if (gameStartMs == null) return;
    const tick = () => {
      const remaining = computeRemaining(gameStartMs, timePenaltySec, baseDurationSec);
      setTimer(remaining);
      if (remaining <= 0) {
        // Time up → treat as fail / redirect
        toast.error("Time is up!");
        router.replace("/result?status=timeout");
      }
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [gameStartMs, timePenaltySec, baseDurationSec, router]);

  const setData = getSetById(setId);
  const levelData = setData?.levels[levelId as 1 | 2 | 3 | 4 | 5 | 6];

  useEffect(() => {
    if (levelId === 5 && levelData && levelData.type === "arrangement") {
      setShuffledLines(shuffleArray(levelData.correctLines));
      setArranged([]);
    }
  }, [levelId, levelData]);

  const applyPenalty = async () => {
    setTimePenaltySec((p) => p + 30);
    setTimer((t) => Math.max(0, t - 30));
    toast.error("-30 seconds!");

    if (isSupabaseConfigured()) {
      try {
        // Read current then increment
        const session = await resolveSession();
        const wrong = (session?.wrongAttempts || 0) + 1;
        const penalty = (session?.timePenalty || 0) + 30;
        await supabaseUpdateProgress({
          wrong_attempts: wrong,
          time_penalty: penalty,
        });
      } catch (e) {
        console.error(e);
      }
    } else if (userId) {
      const p = getUserProgress(userId);
      if (p) {
        updateProgress(userId, {
          wrongAttempts: p.wrongAttempts + 1,
          timePenalty: p.timePenalty + 30,
        });
      }
    }
  };

  const completeLevel = async () => {
    if (!userId) {
      toast.error("Not logged in");
      return;
    }

    let currentLevel = levelId;
    let fragments = 0;
    let score = 0;
    let levelsCompleted: number[] = [];

    if (isSupabaseConfigured()) {
      const session = await resolveSession();
      currentLevel = session?.currentLevel || levelId;
      fragments = session?.fragments || 0;
      score = session?.score || 0;
    } else {
      const p = getUserProgress(userId);
      if (p) {
        currentLevel = p.currentLevel;
        fragments = p.fragments;
        score = p.score;
        levelsCompleted = p.levelsCompleted || [];
      }
    }

    const nextLevel = Math.max(currentLevel, levelId + 1);
    const newFragments = fragments + 1;
    const newScore = score + 15;
    const completed = [...new Set([...levelsCompleted, levelId])];

    if (levelId === 6) {
      if (isSupabaseConfigured()) {
        await supabaseUpdateProgress({
          current_level: 7,
          levels_completed: completed,
          fragments: newFragments,
          score: newScore,
          status: "completed",
          completed_at: new Date().toISOString(),
          final_time: timer,
        });
      } else {
        updateProgress(userId, {
          currentLevel: 7,
          levelsCompleted: completed,
          fragments: newFragments,
          score: newScore,
          status: "completed",
          completedAt: new Date().toISOString(),
          finalTime: timer,
        });
      }
      toast.success("Master Key unlocked!");
      router.push("/victory");
    } else {
      if (isSupabaseConfigured()) {
        await supabaseUpdateProgress({
          current_level: nextLevel,
          levels_completed: completed,
          fragments: newFragments,
          score: newScore,
        });
        // Refresh cached session for map
        try {
          const raw = localStorage.getItem("cq_supabase_session");
          if (raw) {
            const s = JSON.parse(raw);
            s.currentLevel = nextLevel;
            localStorage.setItem("cq_supabase_session", JSON.stringify(s));
          }
        } catch {}
      } else {
        updateProgress(userId, {
          currentLevel: nextLevel,
          levelsCompleted: completed,
          fragments: newFragments,
          score: newScore,
        });
      }
      toast.success("Fragment collected! Next level unlocked.");
      router.push("/map");
    }
  };

  const handleSubmit = async () => {
    if (!levelData) {
      toast.error("Level data missing");
      return;
    }
    if (!userId) {
      toast.error("Please login first");
      router.replace("/login");
      return;
    }
    setLoading(true);

    try {
      let correct = false;
      const ans = answer.trim();

      if (levelData.type === "riddle") {
        correct = ans.toLowerCase() === levelData.answer.toLowerCase();
      } else if (levelData.type === "output") {
        correct = ans === levelData.answer || ans.toLowerCase() === levelData.answer.toLowerCase();
      } else if (levelData.type === "detective") {
        correct =
          ans.toLowerCase().includes(levelData.correctFix.toLowerCase()) ||
          (levelData.options?.some((o) => ans === o) ?? false);
      } else if (levelData.type === "logic") {
        correct = levelData.locks.every(
          (l) => (lockAnswers[l.id] || "").trim().toLowerCase() === l.answer.toLowerCase()
        );
      } else if (levelData.type === "arrangement") {
        correct =
          arranged.length === levelData.correctLines.length &&
          arranged.every((line, i) => line === levelData.correctLines[i]);
      } else if (levelData.type === "memory") {
        correct = ans.toLowerCase() === String(levelData.output).toLowerCase();
      }

      if (correct) {
        toast.success("Correct!");
        await completeLevel();
      } else {
        await applyPenalty();
        if (levelId === 5 && levelData.type === "arrangement") {
          setShuffledLines(shuffleArray(levelData.correctLines));
          setArranged([]);
        }
        setAnswer("");
      }
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message || "Submit failed");
    }
    setLoading(false);
  };

  useEffect(() => {
    if (levelId !== 6 || memoryPhase !== "show") return;
    if (memoryTimer <= 0) {
      setMemoryPhase("question");
      return;
    }
    const t = setTimeout(() => setMemoryTimer((m) => m - 1), 1000);
    return () => clearTimeout(t);
  }, [levelId, memoryPhase, memoryTimer]);

  if (!levelData) {
    return (
      <div className="min-h-screen flex items-center justify-center text-red-400">
        Invalid level or loading...
      </div>
    );
  }

  return (
    <main className="sky-bg min-h-screen py-8 px-4 no-select">
      <div className="max-w-4xl mx-auto mb-6 flex justify-between items-center quest-card-soft p-4">
        <span className="text-cyan-400 font-display font-bold">LEVEL {levelId}</span>
        <span className={`font-mono text-xl ${timer < 60 ? "text-red-400 animate-pulse font-bold" : "text-amber-400 font-bold"}`}>
          ⏱ {formatTime(timer)}
        </span>
      </div>

      <div className="max-w-3xl mx-auto quest-card p-6 md:p-8">
        <AnimatePresence mode="wait">
          {levelData.type === "riddle" && (
            <motion.div key="riddle" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <h2 className="font-display text-xl text-purple-400 font-bold mb-4">CODE RIDDLE</h2>
              <p className="text-lg text-slate-100 font-semibold mb-6">{levelData.question}</p>
              <input
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder="Enter your answer..."
                className="w-full bg-[#0a0e1a] border-2 border-purple-500/40 rounded-xl px-4 py-3 mb-4 text-slate-100 placeholder:text-slate-500 focus:border-purple-400 outline-none"
              />
              <button onClick={handleSubmit} disabled={loading} className="btn-adventure px-8 py-3 text-base">
                SUBMIT
              </button>
            </motion.div>
          )}

          {levelData.type === "output" && (
            <motion.div key="output" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <h2 className="font-display text-xl text-orange-600 font-bold mb-4">OUTPUT HUNT</h2>
              <p className="text-sm text-slate-600 font-medium mb-2">Language: {levelData.language.toUpperCase()}</p>
              <pre className="code-block p-4 text-sm overflow-x-auto mb-4 text-green-300">{levelData.code}</pre>
              <input
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder="Predict the output..."
                className="w-full bg-[#0a0e1a] border-2 border-orange-200 rounded-xl px-4 py-3 mb-4 text-slate-900 placeholder:text-slate-400 focus:border-orange-400 outline-none"
              />
              <button onClick={handleSubmit} className="btn-adventure px-8 py-3 text-base">SUBMIT</button>
            </motion.div>
          )}

          {levelData.type === "detective" && (
            <motion.div key="detective" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <h2 className="font-display text-xl text-sky-300 font-bold mb-4">CODE DETECTIVE</h2>
              <p className="text-slate-100 mb-3 font-medium">{levelData.bugDescription}</p>
              <pre className="code-block p-4 text-sm overflow-x-auto mb-4 text-red-700">{levelData.code}</pre>
              {levelData.options ? (
                <div className="space-y-2 mb-4">
                  {levelData.options.map((opt, i) => (
                    <button
                      key={i}
                      onClick={() => setAnswer(opt)}
                      className={`w-full text-left p-3 rounded-xl border-2 text-slate-100 font-medium ${answer === opt ? "border-sky-500 bg-sky-50" : "border-slate-700 bg-[#0a0e1a] hover:border-sky-300"}`}
                    >
                      {String.fromCharCode(65 + i)}. {opt}
                    </button>
                  ))}
                </div>
              ) : (
                <input value={answer} onChange={(e) => setAnswer(e.target.value)} className="w-full bg-[#0a0e1a] border-2 border-slate-700 rounded-xl px-4 py-3 mb-4 text-slate-900 outline-none" />
              )}
              <button onClick={handleSubmit} className="btn-adventure px-8 py-3 text-base">SUBMIT</button>
            </motion.div>
          )}

          {levelData.type === "logic" && (
            <motion.div key="logic" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <h2 className="font-display text-xl text-emerald-700 font-bold mb-4">LOGIC LOCK</h2>
              <p className="text-slate-600 mb-4">Solve all three locks to proceed.</p>
              {levelData.locks.map((lock) => (
                <div key={lock.id} className="mb-4">
                  <p className="text-slate-100 mb-1 font-medium">{lock.question}</p>
                  <input
                    value={lockAnswers[lock.id] || ""}
                    onChange={(e) => setLockAnswers({ ...lockAnswers, [lock.id]: e.target.value })}
                    className="w-full bg-[#0a0e1a] border border-emerald-500/30 rounded-lg px-3 py-2"
                  />
                </div>
              ))}
              <button onClick={handleSubmit} className="btn-adventure px-8 py-3 text-base">UNLOCK ALL</button>
            </motion.div>
          )}

          {levelData.type === "arrangement" && (
            <motion.div key="arr" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <h2 className="font-cyber text-xl text-rose-300 mb-2">CODE ARRANGEMENT</h2>
              <p className="text-slate-600 mb-4">{levelData.description}</p>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-slate-600 font-semibold mb-2">SHUFFLED</p>
                  <div className="space-y-2 min-h-[200px] border border-dashed border-slate-700 rounded-lg p-2">
                    {shuffledLines.map((line, i) => (
                      <button
                        key={i}
                        onClick={() => {
                          setArranged([...arranged, line]);
                          setShuffledLines(shuffledLines.filter((_, idx) => idx !== i));
                        }}
                        className="w-full text-left text-xs font-mono bg-slate-800 p-2 rounded hover:bg-slate-700"
                      >
                        {line}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-xs text-slate-600 font-semibold mb-2">YOUR ORDER</p>
                  <div className="space-y-2 min-h-[200px] border border-cyan-500/40 rounded-lg p-2">
                    {arranged.map((line, i) => (
                      <button
                        key={i}
                        onClick={() => {
                          setShuffledLines([...shuffledLines, line]);
                          setArranged(arranged.filter((_, idx) => idx !== i));
                        }}
                        className="w-full text-left text-xs font-mono bg-cyan-900/40 p-2 rounded"
                      >
                        {line}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <button onClick={handleSubmit} className="btn-cyber mt-4 px-8 py-3 rounded-xl text-white font-bold">SUBMIT ORDER</button>
            </motion.div>
          )}

          {levelData.type === "memory" && (
            <motion.div key="mem" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              {memoryPhase === "warning" && (
                <div className="text-center">
                  <h2 className="font-cyber text-2xl text-amber-400 font-bold mb-4">⚠ ATTENTION REQUIRED</h2>
                  <p className="text-slate-100 mb-2 font-medium">This is a Code Memory Challenge.</p>
                  <p className="text-slate-400 mb-6">The code will appear only once for a limited time. Memorize it carefully.</p>
                  <button
                    onClick={() => {
                      setMemoryPhase("show");
                      setMemoryTimer(20);
                    }}
                    className="btn-gold px-10 py-3 rounded-xl text-white font-bold"
                  >
                    START MEMORY
                  </button>
                </div>
              )}
              {memoryPhase === "show" && (
                <div>
                  <div className="flex justify-between mb-4">
                    <span className="text-cyan-300">Memorize...</span>
                    <span className="text-2xl font-mono text-red-400">{memoryTimer}s</span>
                  </div>
                  <pre className="code-block p-4 text-sm text-emerald-700 overflow-x-auto">{levelData.code}</pre>
                </div>
              )}
              {memoryPhase === "question" && (
                <div>
                  <h2 className="font-display text-xl text-amber-700 font-bold mb-4">From memory:</h2>
                  <p className="mb-2">1. What is the output?</p>
                  <input
                    value={answer}
                    onChange={(e) => setAnswer(e.target.value)}
                    className="w-full bg-[#0a0e1a] border-2 border-slate-700 rounded-xl px-4 py-3 mb-4 text-slate-900 outline-none"
                  />
                  <p className="mb-2">2. Which language was used?</p>
                  <div className="flex gap-4 mb-6">
                    <button
                      onClick={() => {
                        if (answer.trim() === levelData.output && levelData.language === "python") {
                          completeLevel();
                        } else {
                          applyPenalty();
                          setMemoryPhase("warning");
                          setAnswer("");
                        }
                      }}
                      className="px-6 py-2 border border-cyan-500 rounded-lg hover:bg-cyan-900/30"
                    >
                      ○ Python
                    </button>
                    <button
                      onClick={() => {
                        if (answer.trim() === levelData.output && levelData.language === "java") {
                          completeLevel();
                        } else {
                          applyPenalty();
                          setMemoryPhase("warning");
                          setAnswer("");
                        }
                      }}
                      className="px-6 py-2 border border-cyan-500 rounded-lg hover:bg-cyan-900/30"
                    >
                      ○ Java
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}
