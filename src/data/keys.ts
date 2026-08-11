/**
 * Key fragments earned after each of levels 1–5.
 * Before Master Vault (level 6), player must pick their keys in order.
 */

export type KeyFragment = {
  id: string; // e.g. "k1"
  level: number; // 1–5
  symbol: string;
  code: string; // short code shown to player
  label: string;
  color: string;
};

/** Real keys — one per level 1–5 (same for all sets; identity is the key) */
export const LEVEL_KEYS: KeyFragment[] = [
  {
    id: "k1",
    level: 1,
    symbol: "🔑",
    code: "ALPHA",
    label: "Riddle Key",
    color: "from-purple-500 to-violet-800",
  },
  {
    id: "k2",
    level: 2,
    symbol: "⚡",
    code: "BETA",
    label: "Output Key",
    color: "from-orange-400 to-amber-700",
  },
  {
    id: "k3",
    level: 3,
    symbol: "🕵️",
    code: "GAMMA",
    label: "Detective Key",
    color: "from-sky-400 to-blue-700",
  },
  {
    id: "k4",
    level: 4,
    symbol: "🔐",
    code: "DELTA",
    label: "Logic Key",
    color: "from-emerald-400 to-teal-800",
  },
  {
    id: "k5",
    level: 5,
    symbol: "💎",
    code: "EPSILON",
    label: "Arrangement Key",
    color: "from-rose-400 to-pink-800",
  },
];

/** Decoy keys mixed into the floating gate */
export const DECOY_KEYS: KeyFragment[] = [
  { id: "d1", level: 0, symbol: "🗝️", code: "ZETA", label: "False Key", color: "from-slate-500 to-slate-800" },
  { id: "d2", level: 0, symbol: "⚔️", code: "OMEGA", label: "False Key", color: "from-red-600 to-red-900" },
  { id: "d3", level: 0, symbol: "🛡️", code: "SIGMA", label: "False Key", color: "from-indigo-500 to-indigo-900" },
  { id: "d4", level: 0, symbol: "📜", code: "THETA", label: "False Key", color: "from-yellow-600 to-yellow-900" },
  { id: "d5", level: 0, symbol: "🌀", code: "LAMBDA", label: "False Key", color: "from-cyan-700 to-cyan-950" },
  { id: "d6", level: 0, symbol: "🔮", code: "PHI", label: "False Key", color: "from-fuchsia-600 to-purple-900" },
];

export function getKeyForLevel(level: number): KeyFragment | undefined {
  return LEVEL_KEYS.find((k) => k.level === level);
}

export function getKeyById(id: string): KeyFragment | undefined {
  return [...LEVEL_KEYS, ...DECOY_KEYS].find((k) => k.id === id);
}

/** Local storage helpers */
export function loadCollectedKeys(userId: string): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem("cq_keys_" + userId);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

export function saveCollectedKeys(userId: string, keyIds: string[]) {
  try {
    localStorage.setItem("cq_keys_" + userId, JSON.stringify(keyIds));
  } catch {}
}

export function addCollectedKey(userId: string, keyId: string): string[] {
  const cur = loadCollectedKeys(userId);
  if (!cur.includes(keyId)) cur.push(keyId);
  saveCollectedKeys(userId, cur);
  return cur;
}

export function isKeysVerified(userId: string): boolean {
  try {
    return localStorage.getItem("cq_keys_verified_" + userId) === "1";
  } catch {
    return false;
  }
}

export function setKeysVerified(userId: string, value: boolean) {
  try {
    if (value) localStorage.setItem("cq_keys_verified_" + userId, "1");
    else localStorage.removeItem("cq_keys_verified_" + userId);
  } catch {}
}

/** Build floating pool: all 5 real + decoys, shuffled */
export function buildFloatingPool(): KeyFragment[] {
  const pool = [...LEVEL_KEYS, ...DECOY_KEYS];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool;
}
