# Next Steps — Active Implementation Prompt

> **How to use this file:** This is the single consolidated prompt for the next agent or dev session. Read this before opening any other file. When a milestone is complete, archive this file to `archive/` and replace it with the next prompt.

---

## Current Status

The project has completed its **foundation sprint**. The design system, landing page, and route structure are all in place. The prototype interview loop is still running at `/interview` and is working. The next sprint focuses on making the product production-ready: replacing the macOS-only TTS, adding auth, and wiring up the database.

### What Is Done ✅

**Frontend:**
- Design system — `globals.css` with full light/dark token system (zinc-950 dark, zinc-50 light, violet-600 accent)
- Font setup — Plus Jakarta Sans (display), Geist Sans (UI), Geist Mono (mono) in `layout.tsx`
- `ThemeProvider` (`next-themes`, dark default) + `ThemeToggle` (sun/moon) in nav
- `src/lib/utils.ts` — `cn()` helper
- Landing page at `/` — LandingNav, LandingHero (with mock interview card), HowItWorks, FeatureGrid, LandingCTA, LandingFooter
- Interview prototype moved to `/interview` — all existing functionality intact

**Backend:**
- FastAPI endpoints: `/api/health`, `/api/start`, `/api/chat`
- Groq Whisper ASR (`asr.py`)
- Groq LLaMA follow-up generation (`llm.py`)
- ChromaDB RAG question bank (`rag.py`) — seeded with 4 starter questions

### What Still Needs To Be Built

1. **Replace TTS** (`backend/tts.py`) — macOS `say` blocks all cloud deployment ⚠️ **highest priority**
2. **Auth** — Supabase sign-up / sign-in / session management
3. **Database schema** — Supabase PostgreSQL tables
4. **Interview setup screen** — job role, question type, difficulty before session starts
5. **Post-session feedback** — `/api/feedback` endpoint + report page
6. **Dashboard** — session history, scores, start new interview

---

## Immediate Priorities for This Sprint

### 1. Replace TTS (`backend/tts.py`) — Do This First

The macOS `say` command is the only blocker for Railway deployment. Replace it with ElevenLabs as a drop-in:

```bash
cd backend && pip install elevenlabs
```

```python
# backend/tts.py — new implementation
import os
from elevenlabs import ElevenLabs

def text_to_speech(text: str, output_path: str = "output.mp3") -> str | None:
    client = ElevenLabs(api_key=os.environ.get("ELEVENLABS_API_KEY"))
    voice_id = os.environ.get("ELEVENLABS_VOICE_ID", "21m00Tcm4TlvDq8ikWAM")
    try:
        audio = client.text_to_speech.convert(
            voice_id=voice_id,
            text=text,
            model_id="eleven_multilingual_v2",
            output_format="mp3_44100_128",
        )
        with open(output_path, "wb") as f:
            for chunk in audio:
                f.write(chunk)
        return output_path
    except Exception as e:
        print(f"TTS Error: {e}")
        return None
```

Add `ELEVENLABS_API_KEY` and `ELEVENLABS_VOICE_ID` to `backend/.env`. See [`03-setup/environment-variables.md`](./03-setup/environment-variables.md).

Also add a `backend/nixpacks.toml` for Railway (ffmpeg is still needed for ASR audio conversion):

```toml
[phases.setup]
nixPkgs = ["ffmpeg"]
```

### 2. Auth — Supabase Setup

Install Supabase packages:

```bash
cd frontend && npm install @supabase/supabase-js @supabase/ssr
```

Files to create:
- `src/lib/supabase/client.ts` — browser client (`createBrowserClient`)
- `src/lib/supabase/server.ts` — server client (`createServerClient`)
- `src/middleware.ts` — protect `(app)` routes; redirect unauthenticated to `/login`
- `src/components/providers/SupabaseProvider.tsx` — seeds `auth-store` on mount
- `src/store/auth-store.ts` — Zustand store: `{ user, isLoading, setUser, setLoading }`
- `src/app/(auth)/layout.tsx` — centered auth layout
- `src/app/(auth)/login/page.tsx` + `src/app/(auth)/signup/page.tsx`
- `src/components/features/auth/LoginForm.tsx` + `SignupForm.tsx`
- `src/lib/validations/auth.schema.ts` — Zod schemas

Full auth flow spec: [`02-architecture/auth-flow.md`](./02-architecture/auth-flow.md).

### 3. Database Schema

Run in Supabase SQL editor. Full schema in [`02-architecture/data-flow.md`](./02-architecture/data-flow.md#4-database-schema):

```sql
-- profiles, interview_sessions, session_messages, feedback_reports
-- + RLS policies for all tables
```

### 4. Interview Setup Screen

Once auth is in place, add the configuration screen before a session starts:
- Route: `src/app/(app)/interview/setup/page.tsx`
- Form: job role, question type (technical/behavioral/mixed), difficulty, num rounds
- On submit: INSERT into `interview_sessions`, navigate to `/interview/:sessionId`
- Component: `src/components/features/interview/SetupForm.tsx`

Spec: [`05-features/03-interview-session.md`](./05-features/03-interview-session.md).

---

## Key Decisions (Do Not Change Without Discussion)

| Decision | Choice |
|---|---|
| UI library | shadcn/ui + Tailwind v4 |
| Auth + DB | Supabase |
| TTS | ElevenLabs (replacing macOS `say`) |
| ASR | Groq Whisper (`whisper-large-v3`) |
| LLM | Groq (`llama-3.1-8b-instant`) |
| Frontend deployment | Vercel |
| Backend deployment | Railway |
| Feedback timing | Post-session only — no inline scores during interview |
| Design theme | "Midnight Focus" — zinc-950 dark, violet-600 accent, Plus Jakarta Sans display font |
| Interview route (temp) | `/interview` — prototype lives here until auth + setup flow replaces it |

---

## Archive

Previous sprint archived at [`archive/MILESTONE-01-FOUNDATION.md`](./archive/MILESTONE-01-FOUNDATION.md).

When this sprint is complete, archive this file to `archive/MILESTONE-02-AUTH-TTS.md` and replace with the next prompt.
