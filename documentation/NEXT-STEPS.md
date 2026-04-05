# Next Steps — Active Implementation Prompt

> **How to use this file:** This is the single consolidated prompt for the next agent or dev session. Read this before opening any other file. When a milestone is complete, archive this file to `archive/` and replace it with the next prompt.

---

## Current Status

The project is in its **initial foundation phase**. The existing codebase is a working prototype with a single-page frontend (`frontend/src/app/page.tsx`) and a FastAPI backend. The prototype proves the core loop works (voice → ASR → LLM → TTS → follow-up question) but is not production-ready.

### What Exists (Prototype)

- `frontend/` — Next.js app with a single page: voice interview UI (recording, transcript display, AI response playback)
- `backend/main.py` — FastAPI with three endpoints: `/api/health`, `/api/start`, `/api/chat`
- `backend/asr.py` — Groq Whisper transcription (audio → text)
- `backend/llm.py` — Groq LLaMA evaluation and follow-up generation
- `backend/tts.py` — macOS `say` + ffmpeg TTS (macOS-only, must be replaced before any cloud deployment)
- `backend/rag.py` — ChromaDB question bank with 4 starter questions

### What Needs to Be Built

See the full feature specs in `05-features/`. The priority order for first development sprint:

1. **Replace TTS** — swap `tts.py` from macOS `say` to ElevenLabs API (blocks any cloud deployment)
2. **Frontend migration** — set up shadcn/ui, migrate existing UI to use the component library, set up Tailwind v4 properly
3. **Landing page** — `src/app/page.tsx` becomes a proper marketing/landing page; the interview UI moves to `src/app/interview/`
4. **Auth** — Supabase Auth (email/password sign-up, sign-in, protected routes via middleware)
5. **Database schema** — Supabase PostgreSQL: `users`, `interview_sessions`, `session_messages`, `feedback_reports` tables
6. **Interview configuration screen** — job role selector, question type, difficulty before starting a session
7. **Post-session feedback** — deferred feedback report after session end (remove inline evaluation from current LLM prompt)
8. **Dashboard** — past sessions list, start new interview button

---

## Immediate Priorities for This Sprint

### 1. Replace TTS (`backend/tts.py`)

The macOS `say` command is the single biggest blocker for cloud deployment. Replace with ElevenLabs:

```python
# Target interface (same signature, drop-in replacement)
def text_to_speech(text: str, output_path: str = "output.mp3") -> Optional[str]:
    ...
```

Use the ElevenLabs Python SDK. Voice ID to use: configure via `ELEVENLABS_VOICE_ID` env var. The interviewer voice should be professional and neutral.

### 2. Frontend — shadcn/ui Setup

```bash
cd frontend
npx shadcn@latest init
```

Follow the prompts: TypeScript, Tailwind, App Router, `src/` directory, `@/` alias. Then add the base components needed for the interview UI:

```bash
npx shadcn@latest add button card badge textarea input avatar separator skeleton
```

### 3. Route Structure

The current `src/app/page.tsx` should become the landing page. Move interview logic:

```
src/app/
├── page.tsx                  ← Landing page (new)
├── (auth)/
│   ├── login/page.tsx
│   └── signup/page.tsx
├── (app)/
│   ├── dashboard/page.tsx
│   └── interview/
│       ├── setup/page.tsx    ← Interview configuration
│       └── [sessionId]/
│           └── page.tsx      ← Active interview session
└── report/[sessionId]/page.tsx ← Post-session feedback
```

---

## Key Decisions Already Made

| Decision | Choice | Rationale |
|---|---|---|
| UI library | shadcn/ui + Tailwind v4 | Full ownership, Radix accessibility, Tailwind composition |
| Auth + DB | Supabase | PostgreSQL for relational session data, built-in auth, Vercel integration |
| TTS | ElevenLabs | Cloud-based, high quality, critical for deployment |
| ASR | Groq Whisper (`whisper-large-v3`) | Already working, fast, accurate |
| LLM | Groq (`llama-3.1-8b-instant`) | Already working, fast inference |
| Frontend deployment | Vercel | Native Next.js support |
| Backend deployment | Railway | FastAPI (Python), Docker-based, GitHub deploy |
| Feedback timing | Post-session only | No inline scores during interview — full debrief after |

---

## Do Not Change (Without Discussion)

- The core interview loop contract: audio upload → transcription → LLM follow-up → TTS → audio response
- Groq for ASR and LLM (working, performant)
- Next.js App Router conventions
- The decision to defer all feedback to post-session

---

## Archive

When this sprint is complete, rename this file to `archive/MILESTONE-01-FOUNDATION.md` and replace with the next sprint prompt.
