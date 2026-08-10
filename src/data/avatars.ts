/**
 * Pre-defined avatar faces shown after login.
 * Players pick one; admin sees the same face.
 */
export type AvatarOption = {
  id: string;
  emoji: string;
  label: string;
  bg: string;
};

export const AVATARS: AvatarOption[] = [
  { id: "explorer", emoji: "🧭", label: "Explorer", bg: "from-cyan-500 to-blue-700" },
  { id: "hacker", emoji: "💻", label: "Hacker", bg: "from-emerald-500 to-teal-800" },
  { id: "wizard", emoji: "🧙", label: "Code Wizard", bg: "from-violet-500 to-purple-800" },
  { id: "ninja", emoji: "🥷", label: "Ninja", bg: "from-slate-600 to-slate-900" },
  { id: "robot", emoji: "🤖", label: "Robot", bg: "from-sky-400 to-indigo-700" },
  { id: "fox", emoji: "🦊", label: "Fox", bg: "from-orange-400 to-red-700" },
  { id: "cat", emoji: "🐱", label: "Cat", bg: "from-amber-300 to-orange-600" },
  { id: "owl", emoji: "🦉", label: "Owl", bg: "from-indigo-400 to-purple-700" },
  { id: "dragon", emoji: "🐉", label: "Dragon", bg: "from-red-500 to-rose-900" },
  { id: "astronaut", emoji: "🧑‍🚀", label: "Astronaut", bg: "from-blue-400 to-cyan-800" },
  { id: "detective", emoji: "🕵️", label: "Detective", bg: "from-amber-600 to-yellow-900" },
  { id: "crown", emoji: "👑", label: "Champion", bg: "from-yellow-400 to-amber-700" },
];

export function getAvatarById(id: string | null | undefined): AvatarOption {
  return AVATARS.find((a) => a.id === id) || AVATARS[0];
}

export function getLocalAvatarId(userId: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem("cq_avatar_id_" + userId);
  } catch {
    return null;
  }
}

export function setLocalAvatarId(userId: string, avatarId: string) {
  try {
    localStorage.setItem("cq_avatar_id_" + userId, avatarId);
  } catch {}
}
