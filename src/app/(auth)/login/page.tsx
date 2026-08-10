"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { loginUser, startOrResumeGame } from "@/lib/auth";
import {
  isSupabaseConfigured,
  supabaseLogin,
  supabaseStartGame,
} from "@/lib/supabase-auth";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isSupabaseConfigured()) {
        const result = await supabaseLogin(email, password);
        if (!result.success) {
          toast.error(result.error || "Login failed");
          setLoading(false);
          return;
        }

        const game = await supabaseStartGame();
        if (!game.success) {
          toast.error(game.error || "Cannot start game");
          setLoading(false);
          return;
        }

        // Store minimal session for client pages that still read local helpers
        localStorage.setItem(
          "cq_supabase_session",
          JSON.stringify({
            userId: result.userId,
            displayName: result.displayName,
            setId: game.setId,
            currentLevel: game.currentLevel,
            sessionId: game.sessionId,
          })
        );

        try {
          if (result.userId) localStorage.removeItem("cq_disqualified_" + result.userId);
        } catch {}
        toast.success(`Welcome, ${result.displayName}!`);
        router.push("/avatar-select");
      } else {
        const result = loginUser(email, password);
        if (!result.success || !result.user) {
          toast.error(result.error || "Login failed");
          setLoading(false);
          return;
        }
        const game = startOrResumeGame(result.user.id);
        if (!game.success) {
          toast.error(game.error || "Cannot start game");
          setLoading(false);
          return;
        }
        try {
          localStorage.removeItem("cq_disqualified_" + result.user.id);
        } catch {}
        toast.success(`Welcome, ${result.user.displayName}!`);
        router.push("/avatar-select");
      }
    } catch (err: any) {
      toast.error(err?.message || "Login error");
    }
    setLoading(false);
  };

  return (
    <main className="sky-bg min-h-screen flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="quest-card p-8 rounded-2xl w-full max-w-md shadow-neon"
      >
        <h1 className="font-display text-3xl text-center text-sky-700 mb-2">
          404: Key Not Found
        </h1>
        <p className="text-center text-slate-500 mb-2">Login to continue your adventure</p>
        <p className="text-center text-xs text-emerald-500/80 mb-8">
          {isSupabaseConfigured() ? "● Connected to Supabase" : "○ Local mode"}
        </p>

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-sm text-sky-700 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-white border border-sky-200 rounded-lg px-4 py-3 focus:outline-none focus:border-cyan-400"
              required
            />
            <p className="text-xs text-slate-500 mt-1">Team? Use Member 1 email</p>
          </div>
          <div>
            <label className="block text-sm text-sky-700 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-white border border-sky-200 rounded-lg px-4 py-3 focus:outline-none focus:border-cyan-400"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="btn-cyber w-full py-3 rounded-xl text-white font-bold disabled:opacity-50"
          >
            {loading ? "LOGGING IN..." : "LOGIN & START"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500">
          New explorer?{" "}
          <Link href="/register" className="text-sky-600 hover:underline">
            Register first
          </Link>
        </p>
      </motion.div>
    </main>
  );
}
