"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { registerUser, validatePassword, type PlayMode } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/supabase-auth";

export default function RegisterPage() {
  const router = useRouter();
  const [playMode, setPlayMode] = useState<PlayMode>("individual");
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [member1Name, setMember1Name] = useState("");
  const [member1Email, setMember1Email] = useState("");
  const [member2Name, setMember2Name] = useState("");
  const [member2Email, setMember2Email] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [pwErrors, setPwErrors] = useState<string[]>([]);

  const onPasswordChange = (val: string) => {
    setPassword(val);
    setPwErrors(val.length > 0 ? validatePassword(val).errors : []);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) {
      toast.error("Passwords do not match");
      return;
    }
    const pw = validatePassword(password);
    if (!pw.valid) {
      toast.error("Weak password: " + pw.errors.join(", "));
      return;
    }

    setLoading(true);

    try {
      if (isSupabaseConfigured()) {
        // Server API with service role → no confirmation email → avoids rate limit
        const payload =
          playMode === "individual"
            ? {
                email: email.trim().toLowerCase(),
                password,
                displayName: displayName.trim(),
                playMode: "individual" as const,
                members: null,
              }
            : {
                email: member1Email.trim().toLowerCase(),
                password,
                displayName: `${member1Name.trim()} & ${member2Name.trim()}`,
                playMode: "team" as const,
                members: [
                  {
                    name: member1Name.trim(),
                    email: member1Email.trim().toLowerCase(),
                  },
                  {
                    name: member2Name.trim(),
                    email: member2Email.trim().toLowerCase(),
                  },
                ],
              };

        if (playMode === "team") {
          if (
            member1Email.trim().toLowerCase() ===
            member2Email.trim().toLowerCase()
          ) {
            toast.error("Team members must have different emails");
            setLoading(false);
            return;
          }
        }

        const res = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();

        if (!data.success) {
          toast.error(data.error || "Registration failed");
          setLoading(false);
          return;
        }

        toast.success(
          playMode === "team"
            ? "Team registered! Login with Member 1 email."
            : "Account created! Please login."
        );
        router.push("/login");
      } else {
        // Local fallback only
        const result =
          playMode === "individual"
            ? registerUser({
                playMode: "individual",
                displayName,
                email,
                password,
              })
            : registerUser({
                playMode: "team",
                member1Name,
                member1Email,
                member2Name,
                member2Email,
                password,
              });
        if (!result.success) {
          toast.error(result.error || "Registration failed");
          setLoading(false);
          return;
        }
        toast.success("Account created locally (add Supabase keys for DB)");
        router.push("/login");
      }
    } catch (err: any) {
      toast.error(err?.message || "Registration error");
    }
    setLoading(false);
  };

  return (
    <main className="sky-bg min-h-screen flex items-center justify-center px-4 py-10">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="quest-card p-8 rounded-2xl w-full max-w-lg shadow-neon"
      >
        <h1 className="font-display text-3xl text-center text-sky-700 mb-1">
          JOIN THE QUEST
        </h1>
        <p className="text-center text-slate-500 mb-2 text-sm">
          Create your explorer account
        </p>
        <p className="text-center text-xs text-emerald-500/80 mb-6">
          {isSupabaseConfigured()
            ? "● Saves to Supabase (no email limit)"
            : "○ Local mode – set env keys"}
        </p>

        <div className="mb-6">
          <p className="text-sm text-sky-700 mb-3 text-center">How will you play?</p>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setPlayMode("individual")}
              className={`relative p-4 rounded-xl border-2 transition-all ${
                playMode === "individual"
                  ? "border-cyan-400 bg-cyan-500/20 shadow-neon"
                  : "border-slate-600 bg-slate-900/50"
              }`}
            >
              <div className="text-3xl mb-2">🧑‍💻</div>
              <p className="font-semibold text-sm">Individual</p>
              <p className="text-xs text-slate-500">1 player</p>
            </button>
            <button
              type="button"
              onClick={() => setPlayMode("team")}
              className={`relative p-4 rounded-xl border-2 transition-all ${
                playMode === "team"
                  ? "border-purple-400 bg-purple-500/20"
                  : "border-slate-600 bg-slate-900/50"
              }`}
            >
              <div className="text-3xl mb-2">👥</div>
              <p className="font-semibold text-sm">Team of 2</p>
              <p className="text-xs text-slate-500">2 members · 1 group</p>
            </button>
          </div>
        </div>

        <form onSubmit={handleRegister} className="space-y-4">
          <AnimatePresence mode="wait">
            {playMode === "individual" ? (
              <motion.div
                key="ind"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-4"
              >
                <div>
                  <label className="block text-sm text-sky-700 mb-1">
                    Display Name
                  </label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full bg-white border border-sky-200 rounded-lg px-4 py-3"
                    required
                    minLength={2}
                  />
                </div>
                <div>
                  <label className="block text-sm text-sky-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-white border border-sky-200 rounded-lg px-4 py-3"
                    required
                  />
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="team"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-4"
              >
                <div className="rounded-xl border border-purple-500/30 p-4 space-y-3">
                  <p className="text-xs font-semibold text-purple-300 uppercase">
                    Member 1 (login email)
                  </p>
                  <input
                    type="text"
                    placeholder="Name"
                    value={member1Name}
                    onChange={(e) => setMember1Name(e.target.value)}
                    className="w-full bg-white border border-purple-500/30 rounded-lg px-4 py-2.5"
                    required
                  />
                  <input
                    type="email"
                    placeholder="Email"
                    value={member1Email}
                    onChange={(e) => setMember1Email(e.target.value)}
                    className="w-full bg-white border border-purple-500/30 rounded-lg px-4 py-2.5"
                    required
                  />
                </div>
                <div className="rounded-xl border border-pink-500/30 p-4 space-y-3">
                  <p className="text-xs font-semibold text-pink-300 uppercase">
                    Member 2
                  </p>
                  <input
                    type="text"
                    placeholder="Name"
                    value={member2Name}
                    onChange={(e) => setMember2Name(e.target.value)}
                    className="w-full bg-white border border-pink-500/30 rounded-lg px-4 py-2.5"
                    required
                  />
                  <input
                    type="email"
                    placeholder="Email"
                    value={member2Email}
                    onChange={(e) => setMember2Email(e.target.value)}
                    className="w-full bg-white border border-pink-500/30 rounded-lg px-4 py-2.5"
                    required
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div>
            <label className="block text-sm text-sky-700 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => onPasswordChange(e.target.value)}
              className="w-full bg-white border border-sky-200 rounded-lg px-4 py-3"
              required
            />
            {pwErrors.length > 0 && (
              <ul className="mt-2 text-xs text-red-400">
                {pwErrors.map((err) => (
                  <li key={err}>• {err}</li>
                ))}
              </ul>
            )}
          </div>
          <div>
            <label className="block text-sm text-sky-700 mb-1">
              Confirm Password
            </label>
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="w-full bg-white border border-sky-200 rounded-lg px-4 py-3"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading || pwErrors.length > 0}
            className="btn-cyber w-full py-3 rounded-xl text-white font-bold disabled:opacity-50"
          >
            {loading ? "CREATING..." : "REGISTER"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500">
          Already have an account?{" "}
          <Link href="/login" className="text-sky-600 hover:underline">
            Login
          </Link>
        </p>
      </motion.div>
    </main>
  );
}
