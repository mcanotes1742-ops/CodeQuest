"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";

export default function VictoryPage() {
  const router = useRouter();
  return (
    <main className="sky-bg min-h-screen flex items-center justify-center px-4 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(30)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-yellow-400 rounded-full"
            initial={{
              x: Math.random() * (typeof window !== "undefined" ? window.innerWidth : 1000),
              y: -20,
              opacity: 1,
            }}
            animate={{
              y: (typeof window !== "undefined" ? window.innerHeight : 800) + 20,
              opacity: 0,
            }}
            transition={{
              duration: 2 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 3,
            }}
          />
        ))}
      </div>

      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", duration: 0.8 }}
        className="quest-card p-10 rounded-3xl text-center max-w-md shadow-neon-gold relative z-10"
      >
        <div className="text-6xl mb-4">🏆</div>
        <h1 className="font-display text-3xl text-amber-400 neon-text mb-2">
          CONGRATULATIONS!
        </h1>
        <p className="text-slate-300 mb-6">
          You have unlocked the Digital Treasure!
        </p>
        <div className="text-5xl mb-8">🗝️</div>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => router.push("/result")}
            className="btn-cyber px-6 py-3 rounded-xl text-white font-bold"
          >
            VIEW SUMMARY
          </button>
          <button
            onClick={() => router.push("/")}
            className="glass px-6 py-3 rounded-xl text-cyan-300 font-bold"
          >
            PLAY AGAIN
          </button>
        </div>
      </motion.div>
    </main>
  );
}
