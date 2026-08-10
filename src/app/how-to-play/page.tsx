"use client";
import Link from "next/link";
import { motion } from "framer-motion";

export default function HowToPlay() {
  const steps = [
    { title: "Accept the Mission", desc: "Log in and receive your unique quest set." },
    { title: "Explore the Treasure Map", desc: "6 floating islands. Unlock them sequentially." },
    { title: "Solve Challenges", desc: "Riddles, output prediction, bug hunting, logic locks, code arrangement & memory vault." },
    { title: "Collect Fragments", desc: "Each level awards a Master Key Fragment." },
    { title: "Beware the Timer", desc: "Wrong answers cost 30 seconds. Stay focused!" },
    { title: "Anti-Cheat Active", desc: "No copy-paste, no tab switching. Fair play only." },
    { title: "Unlock the Vault", desc: "Complete all 6 levels to claim the Lost Master Key." },
  ];

  return (
    <main className="min-h-screen py-16 px-6">
      <div className="max-w-3xl mx-auto">
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="font-cyber text-4xl text-center text-cyan-400 neon-text mb-12"
        >
          HOW TO PLAY
        </motion.h1>
        <div className="space-y-6">
          {steps.map((s, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className="glass p-6 rounded-xl flex gap-4"
            >
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center font-bold shrink-0">
                {i + 1}
              </div>
              <div>
                <h3 className="font-semibold text-cyan-300 text-lg">{s.title}</h3>
                <p className="text-slate-400 mt-1">{s.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
        <div className="mt-12 text-center">
          <Link href="/" className="btn-cyber px-8 py-3 rounded-xl text-white font-bold">
            BACK TO LANDING
          </Link>
        </div>
      </div>
    </main>
  );
}
