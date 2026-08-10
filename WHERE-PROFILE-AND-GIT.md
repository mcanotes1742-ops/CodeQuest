# Profile avatar — where code was added

## Files (open these in VS Code)

1. **Profile page (upload photo)**  
   `src/app/(game)/profile/page.tsx`  
   URL after login: **http://localhost:3000/profile**

2. **Session loads avatar**  
   `src/lib/session.ts`  
   - `avatarUrl` on `AppSession`  
   - `getLocalAvatar` / `setLocalAvatar`  
   - Reads `profiles.avatar_url` from Supabase when available  

3. **Map shows photo**  
   `src/app/(game)/map/page.tsx`  
   - Click avatar or “Edit profile photo” → `/profile`

4. **Database column (Supabase)**  
   `supabase/migration_avatar.sql`  
   Run once in Supabase SQL Editor.

## How to use

1. Login  
2. Open map  
3. Click your face / “Edit profile photo”  
4. Choose image → Save Profile  
5. Photo appears on the map  

Local mode stores image in browser `localStorage` (`cq_avatar_<userId>`).  
With Supabase, it also tries Storage bucket `avatars` and `profiles.avatar_url`.

---

# Push project to Git from VS Code

## First time (if folder is not a git repo yet)

In VS Code terminal (inside your project folder):

```bash
git init
git add .
git commit -m "404 Key Not Found - profile avatar and updates"
```

Create a repo on GitHub, then:

```bash
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git branch -M main
git push -u origin main
```

## Every time you change code (from VS Code)

1. **Source Control** icon in the left sidebar (branch icon)  
2. Type a message, e.g. `add profile avatar`  
3. Click **Commit**  
4. Click **Sync** / **Push** (or `...` → Push)

Or in terminal:

```bash
git add .
git commit -m "your message"
git push
```

## Login to GitHub from VS Code

- Install **GitHub Pull Requests and Issues** extension (optional)  
- Or use terminal: `gh auth login`  
- Or when you push, VS Code will ask you to sign in  

**Do not commit** `.env` files (secrets). Keep them in `.gitignore`.
