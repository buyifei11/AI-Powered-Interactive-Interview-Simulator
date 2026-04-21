# Getting Started

## Prerequisites

| Requirement | Version | Notes |
|---|---|---|
| Node.js | 18+ | For the Next.js frontend |
| Python | 3.9+ | For the FastAPI backend |
| ffmpeg | Any recent | Required for audio conversion (`.webm` → `.mp3`) |
| Git | Any | For cloning the repo |

### Install ffmpeg

```bash
# macOS
brew install ffmpeg

# Ubuntu/Debian (Railway deployment installs this via Dockerfile)
apt-get install ffmpeg
```

---

## 1. Clone the Repository

```bash
git clone <repo-url>
cd AI-Powered-Interactive-Interview-Simulator
```

---

## 2. Configure Environment Variables

### Backend

```bash
cd backend
cp .env.example .env
```

Open `backend/.env` and fill in all required values. See [`environment-variables.md`](./environment-variables.md) for the full list and where to get each key.

### Frontend

```bash
cd frontend
cp .env.local.example .env.local
```

Open `frontend/.env.local` and fill in your Supabase URL and anon key. See [`environment-variables.md`](./environment-variables.md) for the full list.

---

## 3. Start the Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate      # Windows: venv\Scripts\activate
pip install -r requirements.txt
python main.py
```

The backend starts at `http://localhost:8000`. Visit `http://localhost:8000/docs` for the auto-generated Swagger UI.

> **ffmpeg:** Both `asr.py` and `tts.py` invoke ffmpeg by name (`"ffmpeg"`) without a hardcoded path, so the system `PATH` is used. Ensure ffmpeg is installed and available on your `PATH` before starting the backend.

---

## 4. Start the Frontend

```bash
cd frontend
npm install
npm run dev
```

The frontend starts at `http://localhost:3000`.

---

## 5. Verify the Setup

1. Open `http://localhost:3000` — the landing page should load.
2. Navigate to `http://localhost:3000/register` — the sign-up form should appear.
3. Navigate to `http://localhost:3000/dashboard` without being logged in — middleware should redirect you to `/login`.
4. Check `http://localhost:8000/api/health` returns `{"status": "ok"}` (requires backend running).

---

## 6. Supabase Setup (Required)

1. Go to [supabase.com](https://supabase.com) and create a new project.

2. **Disable email confirmation** (required for local dev, re-enable for production):
   Supabase Dashboard → Authentication → Providers → Email → toggle **"Confirm email"** OFF.

3. **Run the database migration:**
   In the Supabase Dashboard → SQL Editor → New query, paste and run the contents of [`supabase/migrations/001_profiles.sql`](../../supabase/migrations/001_profiles.sql). This creates the `profiles` table with RLS policies.

4. **Copy your API keys:**
   Dashboard → Settings → API Keys. Copy the **Project URL** and **Publishable key** (the anon key) into `frontend/.env.local`:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_...
   ```

5. **Set the Site URL** for local development:
   Dashboard → Authentication → URL Configuration → Site URL → `http://localhost:3000`.

---

## Development Workflow

### Running Both Services

You'll need two terminal windows:

```bash
# Terminal 1 — Backend
cd backend && source venv/bin/activate && python main.py

# Terminal 2 — Frontend
cd frontend && npm run dev
```

### Hot Reload

- **Frontend:** Next.js dev server has HMR — changes to `src/` files reload instantly in the browser.
- **Backend:** FastAPI runs with `reload=True` in dev mode — changes to `.py` files restart the server automatically.

### Branch Strategy

```
main          — stable, production-ready
feat/*        — feature branches (e.g. feat/auth, feat/landing-page)
fix/*         — bug fix branches
```

Open a PR into `main` for every feature. Do not push directly to `main`.
