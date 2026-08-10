# 404: Key Not Found — Deployment Checklist

## What was fixed

- Fixed the Level page TypeScript narrowing/implicit-`any` issues for:
  - `options`
  - `locks`
  - arrangement lines
- Fixed the Level 6 type mismatch: `Level6Memory` uses `output`, not `answer`.
- Added explicit `baseUrl` to `tsconfig.json` so the `@/*` path alias is unambiguous.
- Added explicit typing for Supabase game-session rows used by the admin participant/session maps.
- Added `.gitignore` for `.next`, `node_modules`, and environment files.

## Before deployment

1. Install dependencies:
   ```bash
   npm install
   ```

2. Run the production build locally:
   ```bash
   npm run build
   ```

3. If VS Code still shows old Problems after replacing the files:
   - Press `Ctrl+Shift+P`
   - Run **TypeScript: Restart TS Server**
   - If needed, close VS Code and reopen the project.
   - Delete `.next` and `*.tsbuildinfo`, then run the build again.

## Vercel / production environment

Set these environment variables in the deployment platform:

```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

Do **not** commit `.env` or `.env.local`.

## Supabase

The project expects the SQL files in `supabase/` to be applied to the Supabase project, including the schema and seed/migration files referenced by the README.

## Important

The source code currently contains both Supabase-backed and local-storage fallback logic. The production game should use the Supabase configuration so that sessions, progress, answers, and anti-cheat state use the intended backend.
