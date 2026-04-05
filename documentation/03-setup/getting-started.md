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

Open `frontend/.env.local` and fill in all required values.

> **Note:** `frontend/.env.local.example` needs to be created as part of the frontend migration sprint. For now, create `frontend/.env.local` manually with the values from [`environment-variables.md`](./environment-variables.md).

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

> **ffmpeg path:** The current prototype hardcodes ffmpeg to `/opt/homebrew/bin/ffmpeg`. If you're on Linux or a different macOS setup, update this path in `asr.py` and `tts.py`, or replace with `shutil.which("ffmpeg")` for portability.

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

1. Open `http://localhost:3000` in your browser.
2. Confirm the page loads without console errors.
3. Check `http://localhost:8000/api/health` returns `{"status": "ok"}`.

---

## 6. Supabase Setup (Planned — Required After Auth Sprint)

Once the auth sprint begins, you'll need a Supabase project.

1. Go to [supabase.com](https://supabase.com) and create a new project.
2. In the Supabase dashboard, open **SQL Editor** and run the schema from [`02-architecture/data-flow.md`](../02-architecture/data-flow.md#4-database-schema) to create the required tables.
3. Enable Row-Level Security on all tables and apply the policies from the same file.
4. In **Authentication → Settings**, set the Site URL to `http://localhost:3000` for local development.
5. Copy the project URL, anon key, and service role key into `frontend/.env.local` and `backend/.env` as described in [`environment-variables.md`](./environment-variables.md).

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
