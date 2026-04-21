# Data Flow

## Overview

The system has two distinct data flows: the **interview session loop** (real-time, audio-heavy, goes through the FastAPI backend) and the **persistence flow** (structured data stored in Supabase PostgreSQL and accessed from the Next.js frontend).

---

## 1. Interview Session Loop

This is the core real-time loop that runs during an active interview.

```
Browser (Next.js)
    │
    │  1. POST /api/start  { job_role, question_type, difficulty, session_id }
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
    │
    ▼
FastAPI Backend (Railway)
    │
    │  a. Save audio blob to disk (uploads/{session_id}_{uuid}.webm)
    │  b. ffmpeg: .webm → .mp3
    │  c. Groq Whisper API → user_transcript: string
    │  d. Groq LLaMA API → follow_up_question: string
    │     (system prompt: "You are a professional interviewer. Ask ONE follow-up
    │      question. Do NOT evaluate or score the answer.")
    │  e. ElevenLabs TTS API → MP3 audio file (outputs/{session_id}_{uuid}.mp3)
    │  f. Clean up temp audio files
    │
    │  ← { user_transcript, ai_response, audio_url: "/api/audio/{filename}" }
    │
    ▼
Browser
    │
    │  - Appends { role: "user", text: user_transcript } to message feed
    │  - Appends { role: "ai", text: ai_response } to message feed
    │  - Fetches audio_url → plays AI voice response
    │  - Updates current_question for next round
    │
    └── [Loop continues until user clicks "End Interview"]
```

---

## 2. Session Persistence Flow

Session data is saved to Supabase at key lifecycle events.

```
Interview Setup Screen (Next.js)
    │
    │  1. User submits config (job_role, question_type, difficulty)
    │  2. Frontend calls Supabase: INSERT into interview_sessions
    │       → returns session_id (UUID)
    │  3. Navigate to /interview/:sessionId
    │
    ▼
Active Interview Session
    │
    │  After each round (ai_response received):
    │  4. Frontend calls Supabase: INSERT into session_messages
    │       { session_id, role: "user", content: user_transcript, turn_index }
    │       { session_id, role: "ai", content: ai_response, turn_index }
    │
    ▼
End Session (user clicks "End Interview")
    │
    │  5. Frontend calls FastAPI: POST /api/feedback
    │       { session_id, messages: [...all Q&A pairs] }
    │
    ▼
FastAPI Backend
    │
    │  6. Groq LLaMA generates full feedback report from transcript
    │       (scores per dimension, suggestions, overall rating)
    │
    │  ← { feedback: FeedbackReport }
    │
    ▼
Frontend
    │
    │  7. INSERT into feedback_reports (Supabase)
    │       { session_id, scores, suggestions, overall_rating, transcript_summary }
    │  8. UPDATE interview_sessions SET status = 'completed', ended_at = now()
    │  9. Navigate to /report/:sessionId
    │
    ▼
Dashboard
    │
    │  10. SELECT from interview_sessions WHERE user_id = auth.uid()
    │       ORDER BY created_at DESC
    │       → Displays session history cards
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

### `interview_sessions`

```sql
id              uuid         PRIMARY KEY DEFAULT gen_random_uuid()
user_id         uuid         REFERENCES auth.users(id)
job_role        text         NOT NULL                        -- e.g. "software engineering"
question_type   text         NOT NULL                        -- "technical" | "behavioral" | "mixed"
difficulty      text         NOT NULL                        -- "easy" | "medium" | "hard"
status          text         DEFAULT 'active'                -- "active" | "completed"
created_at      timestamptz  DEFAULT now()
ended_at        timestamptz
```

### `session_messages`

```sql
id              uuid         PRIMARY KEY DEFAULT gen_random_uuid()
session_id      uuid         REFERENCES interview_sessions(id)
role            text         NOT NULL                        -- "user" | "ai"
content         text         NOT NULL
turn_index      integer      NOT NULL                        -- 0-indexed round number
created_at      timestamptz  DEFAULT now()
```

### `feedback_reports`

```sql
id                  uuid   PRIMARY KEY DEFAULT gen_random_uuid()
session_id          uuid   REFERENCES interview_sessions(id) UNIQUE
overall_rating      integer                                  -- 1–10
clarity_score       integer                                  -- 1–10
structure_score     integer                                  -- 1–10
relevance_score     integer                                  -- 1–10
confidence_score    integer                                  -- 1–10
suggestions         text[]                                   -- array of improvement suggestions
transcript_summary  text                                     -- AI-generated summary
raw_feedback        jsonb                                    -- full LLM response for debugging
created_at          timestamptz DEFAULT now()
```

---

## 5. Row-Level Security (RLS)

All Supabase tables have RLS enabled. Core policies:

```sql
-- Users can only read/write their own sessions
CREATE POLICY "users_own_sessions" ON interview_sessions
  FOR ALL USING (auth.uid() = user_id);

-- Users can only read messages for their own sessions
CREATE POLICY "users_own_messages" ON session_messages
  FOR ALL USING (
    session_id IN (
      SELECT id FROM interview_sessions WHERE user_id = auth.uid()
    )
  );

-- Same for feedback_reports
CREATE POLICY "users_own_reports" ON feedback_reports
  FOR ALL USING (
    session_id IN (
      SELECT id FROM interview_sessions WHERE user_id = auth.uid()
    )
  );
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
