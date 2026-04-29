# Data Flow

## Overview

The system has two distinct data flows: the **interview session loop** (real-time, audio-heavy, goes through the FastAPI backend) and the **persistence flow** (structured data stored in Supabase PostgreSQL and accessed from the Next.js frontend).

---

## 1. Interview Session Loop

This is the core real-time loop that runs during an active interview.

```
Browser (Next.js)
    │
    │  1. POST /api/start  { job_role }
    │  ←─────────────────────────────────────────────────────────────────────
    │       { question: string, session_id: string }
    │
    │  [AI TTS audio plays in browser via <audio> element]
    │
    │  2. User clicks mic → MediaRecorder captures audio → user clicks stop
    │
    │  3. POST /api/chat  multipart/form-data
    │       audio: Blob (webm)
    │       current_question: string
    │       session_id: string
    │       video_frame?: base64 jpeg
    │
    ▼
FastAPI Backend (Railway)
    │
    │  a. Save audio blob to disk (uploads/{session_id}_{uuid}.webm)
    │  b. ffmpeg: .webm → .mp3
    │  c. Groq Whisper API → user_transcript: string
    │  d. Groq LLaMA API → interviewer response
    │  e. Apply session caps in memory:
    │      - max 2 follow-ups per main question
    │      - max 10 main questions total
    │  e. ElevenLabs TTS API → MP3 audio file (outputs/{session_id}_{uuid}.mp3)
    │  f. If max reached: return final score summary + completed=true
    │
    │  ← { user_transcript, ai_response, audio_url, completed }
    │
    ▼
Browser
    │
    │  - Appends { role: "user", text: user_transcript } to message feed
    │  - Appends { role: "ai", text: ai_response } to message feed
    │  - Fetches audio_url → plays AI voice response
    │  - Updates current_question for next round
    │
    └── [Loop continues until user ends early or backend auto-completes]
```

---

## 2. Session + Auth Data Flow

Auth/profile data uses Supabase. Live interview turn state currently uses backend in-memory sessions.

```
Next.js Middleware
    │
    │  validates Supabase auth session
    │  redirects unauthenticated users from /dashboard and /interview to /login
    │
    ▼
Interview Session (FastAPI in-memory)
    │
    │  POST /api/start creates GLOBAL_SESSIONS[session_id]
    │  POST /api/chat updates counters/history in GLOBAL_SESSIONS[session_id]
    │  POST /api/end deletes GLOBAL_SESSIONS[session_id]
    │
    ▼
Profile Data (Supabase)
    │
    │  app layout reads profiles.first_name for topbar greeting
```

---

## 3. Auth Flow (Supabase)

See [`auth-flow.md`](./auth-flow.md) for the full auth flow. At a high level:

```
Browser → Supabase Auth SDK → JWT stored in cookie (via @supabase/ssr)
Next.js middleware → reads cookie → validates session → allows/redirects
Server Components → Supabase server client (reads cookie) → fetches user data
Client Components → Supabase browser client → auth state from session
```

---

## 4. Database Schema

### `users`
Managed by Supabase Auth. Extended with a `profiles` table.

```sql
-- profiles (extends auth.users)
id          uuid  PRIMARY KEY REFERENCES auth.users(id)
full_name   text
created_at  timestamptz DEFAULT now()
```

No interview session persistence tables are currently used by live flow.
Current migration in repo defines `profiles` table only.

---

## 5. Row-Level Security (RLS)

Current enforced RLS policies in repo apply to `profiles`.

```sql
-- Profile row belongs to authenticated user id
CREATE POLICY "Users can view their own profile"
ON public.profiles FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
ON public.profiles FOR INSERT
WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE
USING (auth.uid() = id);
```

---

## 6. External API Calls Summary

| From | To | Protocol | Purpose |
|------|-----|----------|---------|
| Browser | FastAPI (Railway) | HTTPS REST | Interview session loop (audio upload, response) |
| FastAPI | Groq API | HTTPS | ASR (Whisper) + LLM (LLaMA) |
| FastAPI | ElevenLabs API | HTTPS | TTS audio generation |
| Browser | Supabase | HTTPS (SDK) | Auth, session persistence, report fetching |
| Next.js Server | Supabase | HTTPS (SDK, service role) | SSR data loading, RLS bypass for server reads |
