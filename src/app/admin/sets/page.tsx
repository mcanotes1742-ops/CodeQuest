"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

interface SetSummary {
  id: number;
  name: string;
  is_active: boolean;
  level_count: number;
}

export default function SetManagementPage() {
  const [sets, setSets] = useState<SetSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // In production fetch from Supabase:
    // const { data } = await supabase.from('question_sets').select('*, levels(count)')
    // For now show the known structure
    setSets([
      { id: 1, name: "Set Alpha", is_active: true, level_count: 6 },
      { id: 2, name: "Set Beta", is_active: true, level_count: 6 },
      { id: 3, name: "Set Gamma", is_active: true, level_count: 6 },
      { id: 4, name: "Set Delta", is_active: true, level_count: 6 },
      { id: 5, name: "Set Epsilon", is_active: true, level_count: 6 },
      { id: 6, name: "Set Zeta", is_active: true, level_count: 6 },
    ]);
    setLoading(false);
  }, []);

  return (
    <div>
      <h1 className="font-cyber text-2xl text-cyan-400 mb-2">Set Management</h1>
      <p className="text-sm text-slate-500 mb-6">
        All questions are stored in the Supabase <code className="text-cyan-400">levels</code> table.
        Answers are never sent to the client.
      </p>

      {loading ? (
        <p className="text-slate-400">Loading...</p>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {sets.map((set, i) => (
            <motion.div
              key={set.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="glass rounded-xl p-5"
            >
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-semibold text-lg text-purple-300">{set.name}</h2>
                <span className={`text-xs px-2 py-0.5 rounded ${set.is_active ? "bg-emerald-500/20 text-emerald-400" : "bg-slate-600 text-slate-400"}`}>
                  {set.is_active ? "Active" : "Inactive"}
                </span>
              </div>
              <p className="text-sm text-slate-400">Set ID: #{set.id}</p>
              <p className="text-sm text-slate-400">Levels: {set.level_count}</p>
              <p className="text-xs text-slate-500 mt-3">
                Data lives in database. Edit via Supabase Table Editor or re-run seed SQL.
              </p>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
