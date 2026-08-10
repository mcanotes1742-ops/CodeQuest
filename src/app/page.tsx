"use client";

import { motion } from "framer-motion";
import Link from "next/link";

export default function LandingPage() {
  return (
    <main className="sky-bg min-h-screen relative overflow-hidden flex items-center justify-center px-4 py-12">
      {/* Decorative floating islands */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <motion.div
          animate={{ y: [0, -12, 0] }}
          transition={{ duration: 5, repeat: Infinity }}
          className="absolute top-16 left-[8%] w-28 h-20 rounded-2xl island-1 opacity-80 shadow-lg"
        />
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 6, repeat: Infinity }}
          className="absolute top-28 right-[10%] w-36 h-24 rounded-2xl island-2 opacity-80 shadow-lg"
        />
        <motion.div
          animate={{ y: [0, -8, 0] }}
          transition={{ duration: 4.5, repeat: Infinity }}
          className="absolute bottom-24 left-[15%] w-32 h-22 rounded-2xl island-6 opacity-70 shadow-lg"
        />
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-emerald-900/40 to-transparent" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 quest-card max-w-xl w-full p-10 text-center"
      >
        <div className="text-5xl mb-3">🔑</div>
        <h1 className="font-display text-4xl md:text-5xl font-bold text-cyan-400 tracking-wide">
          <span className="text-cyan-400">404:</span>{" "}
          <span className="text-amber-400">Key Not Found</span>
        </h1>
        <p className="mt-2 text-amber-400 font-bold tracking-widest text-sm uppercase">
          ✦ Debug the Vault ✦
        </p>
        <p className="mt-5 text-slate-400 leading-relaxed">
          A coding adventure. A legendary treasure.
          <br />
          Do you have what it takes?
        </p>

        <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/register" className="btn-adventure px-8 py-3.5 text-lg inline-block">
            START ADVENTURE
          </Link>
          <Link
            href="/how-to-play"
            className="px-8 py-3.5 rounded-full font-bold text-cyan-400 bg-slate-900/80 border-2 border-cyan-500/40 shadow-md hover:bg-slate-800 text-cyan-300"
          >
            HOW TO PLAY
          </Link>
        </div>

        <p className="mt-6 text-sm text-slate-400">
          Already an explorer?{" "}
          <Link href="/login" className="text-cyan-400 font-bold underline">
            Login
          </Link>
        </p>
      </motion.div>
    </main>
  );
}
