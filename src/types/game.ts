export type LevelType = "riddle" | "output" | "detective" | "logic" | "arrangement" | "memory";
export type Language = "python" | "java";

/** Safe level data sent to the client (NO answers) */
export interface PublicLevel {
  id: string;
  set_id: number;
  level_number: number;
  level_type: LevelType;
  language: Language | null;
  question_text: string | null;
  code_snippet: string | null;
  description: string | null;
  options: string[] | null;
  shuffled_lines: string[] | null;
}

export interface GameSession {
  id: string;
  user_id: string;
  set_id: number;
  current_level: number;
  levels_completed: number[];
  fragments: number;
  score: number;
  wrong_attempts: number;
  time_penalty: number;
  started_at: string;
  completed_at: string | null;
  final_time: number | null;
  status: "active" | "completed" | "disqualified" | "abandoned";
}

export interface GameSettings {
  starting_timer: number;
  wrong_answer_penalty: number;
  memory_duration: number;
  game_active: boolean;
  allow_replay: boolean;
  leaderboard_visible: boolean;
}

export interface SubmitResult {
  correct: boolean;
  penalty?: number;
  next_level?: number;
  fragments?: number;
  completed?: boolean;
}
