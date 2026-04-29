# Feature: Interview Session

## Purpose

Core product experience. User picks job role, enters live voice interview, gets AI follow-ups, then receives final result after session completion.

**Users:** Authenticated

---

## Routes

| URL | Page | Auth required |
|-----|------|--------------|
| `/interview` | Interview setup + active session in single page | Yes |

---

## Current User Flow

```
/dashboard → "Start New Interview" button
    ↓
/interview — user selects:
  - Job role (dropdown)
    ↓
Start Session:
  - Request camera + microphone permission up front
  - POST /api/start with { job_role }
    ↓
/interview — interview begins:
  1. First question shown in chat
  2. User clicks mic button → records answer → clicks to stop
  3. Optional webcam frame captured and sent with audio
  4. POST /api/chat → transcript + AI response + TTS audio + completed flag
  5. AI response spoken aloud and displayed in chat feed
  6. Repeat until completion or user ends session early
    ↓
Session end paths:
  - Auto end after backend cap (10 main questions) → final score returned
  - Manual end with confirm modal → POST /api/end → navigate to /dashboard
```

---

## Interview Setup (`/interview`)

### Form Fields

| Field | Type | Options | Required |
|---|---|---|---|
| `job_role` | Select | `"software engineering"`, `"machine learning"`, `"data science"`, `"data analyst"` | Yes |

### On Submit

1. Validate form with Zod
2. Request camera/mic permission (`getUserMedia`)
3. `POST /api/start { job_role }`
4. Persist `session_id` + first question in local component state

---

## Active Interview Session (`/interview`)

### Session Initialization

On interview start:
1. Call `POST /api/start { job_role }`
2. Display first question in chat feed
3. Open camera preview panel

### Recording Flow

```
[Idle state]
User clicks mic button
    ↓
[Recording state]
MediaRecorder.start(100ms timeslice)
Mic button shows "recording" visual (red, pulsing)
    ↓
User clicks mic button again (or recording reaches max duration)
    ↓
MediaRecorder.stop()
audioChunks → Blob (audio/webm)
    ↓
[Loading state]
FormData: { audio: Blob, current_question, session_id, video_frame? }
POST /api/chat
    ↓
[Response received]
- Append user message to chat feed
- Append AI message to chat feed
- Auto-play TTS audio (unlocked by silent buffer played on "Start Interview" click)
- Update current_question for next round
    ↓
[Idle state — ready for next round]
```

### Recording Guards

- Minimum recording duration: 500ms. If shorter, discard and show toast: "Recording too short — please try again."
- Maximum recording duration: configurable timeout (default 120s). Auto-stop after timeout.
- Empty audio file: caught server-side by `asr.py`; returns an error response. Show toast and allow retry.

### Ending the Session

User clicks "End Interview" button:
1. If currently recording → stop recording first (discard the in-progress answer)
2. Show confirmation dialog.
3. On confirm:
   a. stop local media tracks immediately (camera/mic off)
   b. `POST /api/end { session_id }`
   c. navigate to `/dashboard`

Automatic completion path:
- Backend ends session when max main-question cap reached.
- `POST /api/chat` returns `{ completed: true, ai_response: final_score_text }`.
- Frontend marks interview complete and stops local media.

---

## Backend Calls

| Action | Endpoint | Notes |
|--------|----------|-------|
| Get first question | `POST /api/start` | Called on Start Session |
| Submit answer | `POST /api/chat` | Called after each recording stop |
| End session early | `POST /api/end` | Called after end confirmation |
| Fetch TTS audio | `GET /api/audio/{filename}` | Fetched from `audio_url` in chat response |

---

## State (Current: local React state in page component)

```typescript
type Session = { id: string; currentQuestion: string } | null;
type Message = { role: "ai" | "user"; text: string; audioUrl?: string };
```

---

## Components

| Component | Location | Purpose |
|-----------|----------|---------|
| `InterviewSimulator` | `src/app/(app)/interview/page.tsx` | Setup + active interview + end confirmation modal |

---

## Key Edge Cases

- **Microphone permission denied:** Show a persistent error state with instructions for enabling microphone access in browser settings. Do not silently fail.
- **Backend unreachable:** If `POST /api/chat` fails, show a retry option. Do not lose the current question — keep it displayed so the user can try again.
- **TTS audio blocked by browser:** Browsers require a user gesture before allowing programmatic audio playback. The "Start Interview" button click is used to play a silent audio buffer via the Web Audio API, which unlocks autoplay for the session. Subsequent `audio.play()` calls will succeed. If playback still fails (e.g. the user navigated away and back), the `<audio controls>` player rendered inside each AI message bubble acts as a fallback.
- **Page refresh during session:** Frontend in-memory state resets. Browser shows native leave warning (`beforeunload`) while active, but if user confirms refresh, interview session UI state is not restored.
- **Network timeout on audio upload:** Large audio files on slow connections may timeout. Set a generous fetch timeout (30s) and show a "still processing..." indicator after 5s.
- **Leave-page while active:** in-app link clicks are intercepted; confirmation modal asks user before ending and navigating away.
- **Refresh/close tab while active:** `beforeunload` native browser prompt shown.
