# Environment Variables

## Backend (`backend/.env`)

| Variable | Required | Description | Where to get it |
|---|---|---|---|
| `GROQ_API_KEY` | Yes | API key for Groq (Whisper ASR + LLaMA LLM) | [console.groq.com](https://console.groq.com) — free tier available |
| `ELEVENLABS_API_KEY` | Yes | API key for ElevenLabs TTS | [elevenlabs.io](https://elevenlabs.io) — free tier (10k chars/month) |
| `ELEVENLABS_VOICE_ID` | Yes | ID of the ElevenLabs voice to use for the AI interviewer | ElevenLabs dashboard → Voices → copy Voice ID. Recommended: `21m00Tcm4TlvDq8ikWAM` (Rachel, neutral/professional) |
| `SUPABASE_URL` | Planned | Supabase project URL | Supabase dashboard → Settings → API → Project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Planned | Supabase service role key (server-only, bypasses RLS) | Supabase dashboard → Settings → API → service_role key. **Never expose this in the frontend.** |
| `FFMPEG_PATH` | Optional | Absolute path to ffmpeg binary | Defaults to `ffmpeg` (system PATH). Override if needed: `/opt/homebrew/bin/ffmpeg` on macOS |

### Example `backend/.env`

```env
# Groq API (ASR + LLM)
GROQ_API_KEY=gsk_...

# ElevenLabs TTS
ELEVENLABS_API_KEY=sk_...
ELEVENLABS_VOICE_ID=21m00Tcm4TlvDq8ikWAM

# Supabase (planned — add after auth sprint)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Optional overrides
# FFMPEG_PATH=/opt/homebrew/bin/ffmpeg
```

---

## Frontend (`frontend/.env.local`)

| Variable | Required | Description | Where to get it |
|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Planned | Supabase project URL (safe to expose — public) | Supabase dashboard → Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Planned | Supabase anon/public key (safe to expose) | Supabase dashboard → Settings → API → anon key |
| `NEXT_PUBLIC_BACKEND_URL` | Yes | URL of the FastAPI backend | `http://localhost:8000` for local dev; Railway URL for production |

### Example `frontend/.env.local`

```env
# Backend API
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000

# Supabase (planned — add after auth sprint)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

---

## Production Environment Variables

### Vercel (Frontend)

Set these in Vercel dashboard → Project → Settings → Environment Variables:

| Variable | Production Value |
|---|---|
| `NEXT_PUBLIC_BACKEND_URL` | Your Railway backend URL (e.g. `https://interview-sim-backend.up.railway.app`) |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key |

### Railway (Backend)

Set these in Railway dashboard → Service → Variables:

| Variable | Notes |
|---|---|
| `GROQ_API_KEY` | Same as local |
| `ELEVENLABS_API_KEY` | Same as local |
| `ELEVENLABS_VOICE_ID` | Same as local |
| `SUPABASE_URL` | Same as local |
| `SUPABASE_SERVICE_ROLE_KEY` | Same as local |
| `PORT` | Railway sets this automatically — do not override |

---

## Security Rules

- **Never commit `.env` or `.env.local` to git.** Both are in `.gitignore`.
- **Never put `SUPABASE_SERVICE_ROLE_KEY` in any `NEXT_PUBLIC_` variable.** The service role key bypasses RLS and must only exist on the server.
- **Never put `SUPABASE_SERVICE_ROLE_KEY` in the frontend.** It should only be in the backend `.env` (or Railway variables).
- The `NEXT_PUBLIC_SUPABASE_ANON_KEY` is safe to expose — Supabase RLS handles access control.
