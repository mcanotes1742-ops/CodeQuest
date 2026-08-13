/**
 * Auth & Session helpers
 * Currently uses localStorage for demo.
 * Replace with Supabase Auth + DB calls for production.
 */

export type PlayMode = "individual" | "team";

export interface TeamMember {
  name: string;
  email: string;
}

export interface UserAccount {
  id: string;
  email: string; // primary login email (member 1 for team)
  displayName: string; // primary name or "Name1 & Name2"
  passwordHash: string;
  createdAt: string;
  isAdmin?: boolean;
  playMode: PlayMode;
  /** Only for team mode */
  members?: TeamMember[];
}

export interface GameSession {
  userId: string;
  setId: number;
  currentLevel: number;
  levelsCompleted: number[];
  fragments: number;
  score: number;
  wrongAttempts: number;
  timePenalty: number;
  startedAt: string;
  status: "active" | "completed" | "disqualified" | "abandoned";
  finalTime?: number | null;
  completedAt?: string | null;
}

const USERS_KEY = "cq_users";
const SESSION_KEY = "cq_session";
const PROGRESS_KEY = "cq_progress";

function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return "h" + Math.abs(hash).toString(36);
}

export function getUsers(): UserAccount[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(USERS_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveUsers(users: UserAccount[]) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

export function getAllProgress(): Record<string, GameSession> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(PROGRESS_KEY) || "{}");
  } catch {
    return {};
  }
}

function saveAllProgress(data: Record<string, GameSession>) {
  localStorage.setItem(PROGRESS_KEY, JSON.stringify(data));
}

export function getCurrentUserId(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(SESSION_KEY);
}

export function getCurrentUser(): UserAccount | null {
  const id = getCurrentUserId();
  if (!id) return null;
  return getUsers().find((u) => u.id === id) || null;
}

export function getUserProgress(userId: string): GameSession | null {
  const all = getAllProgress();
  return all[userId] || null;
}

export function getAllowDisqualifiedReplay(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const raw = localStorage.getItem("cq_game_settings");
    if (raw) {
      const s = JSON.parse(raw);
      return !!s.allowDisqualifiedReplay;
    }
  } catch {}
  return false;
}


/** Password strength rules */
export function validatePassword(password: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (password.length < 8) errors.push("At least 8 characters");
  if (!/[A-Z]/.test(password)) errors.push("At least one uppercase letter");
  if (!/[a-z]/.test(password)) errors.push("At least one lowercase letter");
  if (!/[0-9]/.test(password)) errors.push("At least one number");
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password))
    errors.push("At least one special character (!@#$%^&* etc.)");
  return { valid: errors.length === 0, errors };
}

export interface RegisterIndividualInput {
  playMode: "individual";
  displayName: string;
  email: string;
  password: string;
}

export interface RegisterTeamInput {
  playMode: "team";
  member1Name: string;
  member1Email: string;
  member2Name: string;
  member2Email: string;
  password: string;
}

export type RegisterInput = RegisterIndividualInput | RegisterTeamInput;

/** Case-insensitive name match across individual + team member names */
function isDisplayNameTaken(users: UserAccount[], name: string): boolean {
  const n = name.trim().toLowerCase();
  if (!n) return false;
  return users.some((u) => {
    if (u.displayName?.trim().toLowerCase() === n) return true;
    if (u.members?.some((m) => m.name?.trim().toLowerCase() === n)) return true;
    return false;
  });
}

export function registerUser(
  input: RegisterInput
): { success: boolean; error?: string; user?: UserAccount } {
  const users = getUsers();

  if (input.playMode === "individual") {
    const normalizedEmail = input.email.trim().toLowerCase();

    if (!normalizedEmail || !normalizedEmail.includes("@")) {
      return { success: false, error: "Valid email is required" };
    }
    if (users.some((u) => u.email === normalizedEmail || u.members?.some((m) => m.email === normalizedEmail))) {
      return { success: false, error: "Email already registered. Please login." };
    }

    const pwCheck = validatePassword(input.password);
    if (!pwCheck.valid) {
      return { success: false, error: "Weak password: " + pwCheck.errors.join(", ") };
    }
    if (!input.displayName.trim() || input.displayName.trim().length < 2) {
      return { success: false, error: "Display name must be at least 2 characters" };
    }
    if (isDisplayNameTaken(users, input.displayName)) {
      return { success: false, error: "This name is already taken. Choose a different name." };
    }

    const user: UserAccount = {
      id: "u_" + Date.now() + "_" + Math.random().toString(36).slice(2, 8),
      email: normalizedEmail,
      displayName: input.displayName.trim(),
      passwordHash: simpleHash(input.password),
      createdAt: new Date().toISOString(),
      playMode: "individual",
    };

    users.push(user);
    saveUsers(users);
    return { success: true, user };
  }

  // Team mode
  const email1 = input.member1Email.trim().toLowerCase();
  const email2 = input.member2Email.trim().toLowerCase();
  const name1 = input.member1Name.trim();
  const name2 = input.member2Name.trim();

  if (!email1.includes("@") || !email2.includes("@")) {
    return { success: false, error: "Both members need valid emails" };
  }
  if (email1 === email2) {
    return { success: false, error: "Team members must have different emails" };
  }
  if (name1.length < 2 || name2.length < 2) {
    return { success: false, error: "Both names must be at least 2 characters" };
  }
  if (name1.toLowerCase() === name2.toLowerCase()) {
    return { success: false, error: "Team members must have different names" };
  }
  if (isDisplayNameTaken(users, name1) || isDisplayNameTaken(users, name2)) {
    return { success: false, error: "One or both names are already taken. Choose different names." };
  }
  if (isDisplayNameTaken(users, `${name1} & ${name2}`)) {
    return { success: false, error: "This team name is already taken." };
  }

  const emailTaken = (email: string) =>
    users.some(
      (u) => u.email === email || u.members?.some((m) => m.email === email)
    );

  if (emailTaken(email1) || emailTaken(email2)) {
    return { success: false, error: "One or both emails are already registered" };
  }

  const pwCheck = validatePassword(input.password);
  if (!pwCheck.valid) {
    return { success: false, error: "Weak password: " + pwCheck.errors.join(", ") };
  }

  const user: UserAccount = {
    id: "u_" + Date.now() + "_" + Math.random().toString(36).slice(2, 8),
    email: email1, // primary login email = member 1
    displayName: `${name1} & ${name2}`,
    passwordHash: simpleHash(input.password),
    createdAt: new Date().toISOString(),
    playMode: "team",
    members: [
      { name: name1, email: email1 },
      { name: name2, email: email2 },
    ],
  };

  users.push(user);
  saveUsers(users);
  return { success: true, user };
}

export function loginUser(
  email: string,
  password: string
): { success: boolean; error?: string; user?: UserAccount } {
  const users = getUsers();
  const normalizedEmail = email.trim().toLowerCase();

  // Match primary email OR any team member email
  const user = users.find(
    (u) =>
      u.email === normalizedEmail ||
      u.members?.some((m) => m.email === normalizedEmail)
  );

  if (!user) {
    return { success: false, error: "No account found. Please register first." };
  }
  if (user.passwordHash !== simpleHash(password)) {
    return { success: false, error: "Incorrect password" };
  }

  const progress = getUserProgress(user.id);
  if (progress?.status === "disqualified" && !getAllowDisqualifiedReplay()) {
    return {
      success: false,
      error: "This account has been disqualified and cannot play again.",
    };
  }

  localStorage.setItem(SESSION_KEY, user.id);
  return { success: true, user };
}

export function logoutUser() {
  localStorage.removeItem(SESSION_KEY);
}


/** Prefer least-used set 1–6 so players get different sets */
export function pickBalancedSetId(): number {
  const all = getAllProgress();
  const counts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
  for (const s of Object.values(all)) {
    const id = s?.setId;
    if (id >= 1 && id <= 6) counts[id] = (counts[id] || 0) + 1;
  }
  let min = Infinity;
  const candidates: number[] = [];
  for (let i = 1; i <= 6; i++) {
    if (counts[i] < min) {
      min = counts[i];
      candidates.length = 0;
      candidates.push(i);
    } else if (counts[i] === min) {
      candidates.push(i);
    }
  }
  return candidates[Math.floor(Math.random() * candidates.length)] || pickBalancedSetId();
}

export function startOrResumeGame(
  userId: string
): { success: boolean; error?: string; session?: GameSession } {
  const existing = getUserProgress(userId);

  if (existing) {
    if (existing.status === "disqualified") {
      if (!getAllowDisqualifiedReplay()) {
        return {
          success: false,
          error: "You have been disqualified and cannot play with this account.",
        };
      }
      // Admin allowed replay: reset session
      const setId = pickBalancedSetId();
      const session: GameSession = {
        userId,
        setId,
        currentLevel: 1,
        levelsCompleted: [],
        fragments: 0,
        score: 0,
        wrongAttempts: 0,
        timePenalty: 0,
        startedAt: new Date().toISOString(),
        status: "active",
      };
      const all = getAllProgress();
      all[userId] = session;
      saveAllProgress(all);
      return { success: true, session };
    }
    if (existing.status === "completed") {
      return {
        success: false,
        error: "You already completed the quest with this account.",
      };
    }
    return { success: true, session: existing };
  }

  const setId = pickBalancedSetId();
  const session: GameSession = {
    userId,
    setId,
    currentLevel: 1,
    levelsCompleted: [],
    fragments: 0,
    score: 0,
    wrongAttempts: 0,
    timePenalty: 0,
    startedAt: new Date().toISOString(),
    status: "active",
  };

  const all = getAllProgress();
  all[userId] = session;
  saveAllProgress(all);
  return { success: true, session };
}

export function updateProgress(userId: string, updates: Partial<GameSession>) {
  const all = getAllProgress();
  // Upsert: Supabase path may never have created a local entry yet
  const existing = all[userId];
  all[userId] = {
    userId,
    setId: existing?.setId ?? updates.setId ?? 1,
    currentLevel: existing?.currentLevel ?? 1,
    levelsCompleted: existing?.levelsCompleted ?? [],
    fragments: existing?.fragments ?? 0,
    score: existing?.score ?? 0,
    wrongAttempts: existing?.wrongAttempts ?? 0,
    timePenalty: existing?.timePenalty ?? 0,
    startedAt: existing?.startedAt ?? new Date().toISOString(),
    status: existing?.status ?? "active",
    finalTime: existing?.finalTime ?? null,
    completedAt: existing?.completedAt ?? null,
    ...updates,
  };
  saveAllProgress(all);
}

export function disqualifyUser(userId: string) {
  // Keep progress numbers so result page can show them — do NOT logout here
  updateProgress(userId, {
    status: "disqualified",
    completedAt: new Date().toISOString(),
  });
  try {
    localStorage.setItem("cq_disqualified_" + userId, "1");
  } catch {}
}

export function getAllParticipantsForAdmin() {
  const users = getUsers();
  const progress = getAllProgress();
  return users.map((u) => {
    const p = progress[u.id];
    return {
      id: u.id,
      name: u.displayName,
      email: u.email,
      playMode: u.playMode || "individual",
      members: u.members || null,
      setId: p?.setId ?? null,
      status: p?.status ?? "not_started",
      currentLevel: p?.currentLevel ?? 0,
      score: p?.score ?? 0,
      fragments: p?.fragments ?? 0,
      wrongAttempts: p?.wrongAttempts ?? 0,
      joinedAt: u.createdAt,
    };
  });
}
