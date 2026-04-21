# Next Steps — Active Implementation Prompt

> **How to use this file:** This is the single consolidated prompt for the next agent or dev session. Read this before opening any other file. When a milestone is complete, archive this file to `archive/` and replace it with the next prompt.

---

## Current Status

The project has completed its **auth + dashboard sprint**. Users can register, sign in, and sign out. All app routes are protected by middleware. The prototype interview loop is accessible to authenticated users at `/interview`. The next sprint focuses on replacing the macOS-only TTS, adding the interview setup screen, and building post-session feedback.

### What Is Done ✅

**Frontend:**
- Design system — `globals.css` with full light/dark token system (zinc-950 dark, zinc-50 light, violet-600 accent)
- Font setup — Plus Jakarta Sans (display), Geist Sans (UI), Geist Mono (mono)
- `ThemeProvider` (`next-themes`, dark default) + `ThemeToggle` (sun/moon) in nav
- `src/lib/utils.ts` — `cn()` helper
- `src/lib/supabase/client.ts` — Supabase browser client
- `src/lib/supabase/server.ts` — Supabase server client (SSR)
- `src/middleware.ts` — route protection + token rotation
- Landing page at `/` — LandingNav, LandingHero, HowItWorks, FeatureGrid, LandingCTA, LandingFooter
- Auth — `/register` (RegisterForm), `/login` (LoginForm) with Zod + react-hook-form
- Sign-out via Server Action (`app/actions/auth.ts`)
- `(app)/layout.tsx` — AppTopbar with logo, nav, user name, sign-out
- `(app)/dashboard` — personalized greeting, stat placeholders, empty state CTA
- `(app)/interview` — prototype interview loop, now protected by middleware

**Backend:**
- FastAPI endpoints: `/api/health`, `/api/start`, `/api/chat`
- Groq Whisper ASR (`asr.py`)
- Groq LLaMA follow-up generation (`llm.py`)
- ChromaDB RAG question bank (`rag.py`) — seeded with 4 starter questions
- macOS `say` + ffmpeg TTS (`tts.py`) — ⚠️ still needs replacement

**Database:**
- `supabase/migrations/001_profiles.sql` — profiles table with RLS

### What Still Needs To Be Built

1. **Replace TTS** (`backend/tts.py`) — macOS `say` blocks all cloud deployment ⚠️ **highest priority**
2. **Interview setup screen** — job role, question type, difficulty before session starts
3. **Post-session feedback** — `/api/feedback` endpoint + report page
4. **Wire dashboard to real data** — session history, scores from Supabase

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

### 2. Interview Setup Screen

Once TTS is replaced, add the configuration screen before a session starts:

- Route: `src/app/(app)/interview/setup/page.tsx` — URL: `/interview/setup`
- Form: job role, question type (technical/behavioral/mixed), difficulty, num rounds
- On submit: INSERT into `interview_sessions` (Supabase), navigate to `/interview/:sessionId`
- Component: `src/components/features/interview/SetupForm.tsx`
- Also requires: `supabase/migrations/002_interview_sessions.sql`

Spec: [`05-features/03-interview-session.md`](./05-features/03-interview-session.md).

### 3. Post-Session Feedback

- Backend: `POST /api/feedback` — takes `session_id`, fetches messages from Supabase, generates structured report with Groq, saves to `feedback_reports` table
- Frontend: `/report/:sessionId` — displays score, strengths, areas to improve, full transcript
- Requires: `supabase/migrations/003_feedback_reports.sql`

Spec: [`05-features/04-post-session-feedback.md`](./05-features/04-post-session-feedback.md).

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
| Auth strategy | Supabase Auth + `@supabase/ssr` cookie sessions; route protection via `middleware.ts` |
| Profile storage | `user_metadata` (fallback) + `public.profiles` table (primary) |

---

## Archive

- [`archive/MILESTONE-01-FOUNDATION.md`](./archive/MILESTONE-01-FOUNDATION.md) — Design system, landing page, route structure
- [`archive/MILESTONE-02-AUTH-DASHBOARD.md`](./archive/MILESTONE-02-AUTH-DASHBOARD.md) — Auth, protected routes, basic dashboard

When this sprint is complete, archive this file to `archive/MILESTONE-03-TTS-INTERVIEW.md` and replace with the next prompt.
