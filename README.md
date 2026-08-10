# 404: Key Not Found

Production-ready cyberpunk coding adventure.

## Tech Stack
- Next.js 15 (App Router) + TypeScript
- Tailwind CSS + Framer Motion
- Supabase (Auth + PostgreSQL + RLS)
- All questions & answers stored in the database

## Critical: Database Setup

### 1. Run Schema
In Supabase SQL Editor → run **entire** file:
```
supabase/schema.sql
```

### 2. Seed Questions
Then run:
```
supabase/seed_questions.sql
```
This inserts 6 complete question sets (all levels) into the `levels` table.

### 3. Environment
```env
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
```

## Security Model
- Client only receives **public** level data via the `levels_public` view
- Answers live in `levels.correct_answer` / `correct_lines` and are **never** selected by the client
- All answer checking happens inside the Postgres function `submit_answer()`
- Random set assignment is done by `start_game()` on the server
- Anti-cheat ends the session on copy/paste or tab switch

## Admin
Open `/admin?key=admin123` (demo) or set `is_admin = true` on a profile.

## Game Flow
Landing → How to Play → Login → Briefing → Map → Levels 1-6 → Victory → Results

## Scripts
```bash
npm install
npm run dev
```
