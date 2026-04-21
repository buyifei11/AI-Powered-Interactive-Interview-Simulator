# Feature: Interview Session

## Purpose

The core product experience. The user configures an interview (job role, question type, difficulty), then enters a live voice-based session where an AI interviewer asks questions, listens to spoken answers, and generates intelligent follow-up questions. No scores or feedback are shown during the session — the AI behaves purely as an interviewer.

**Users:** Authenticated

---

## Routes

| URL | Page | Auth required |
|-----|------|--------------|
| `/interview/setup` | Interview configuration form | Yes |
| `/interview/[sessionId]` | Active interview session | Yes |

---

## User Flow

```
/dashboard → "Start New Interview" button
    ↓
/interview/setup — user selects:
  - Job role (dropdown or text input): e.g. "Software Engineering", "Data Science", "Product Management"
  - Question type: "Technical" | "Behavioral" | "Mixed"
  - Difficulty: "Easy" | "Medium" | "Hard"
  - (Optional) Number of rounds: 3 | 5 | 10
    ↓
Submit → create session in Supabase → navigate to /interview/:sessionId
    ↓
/interview/:sessionId — interview begins:
  1. POST /api/start → first question returned + spoken aloud (TTS)
  2. User clicks mic button → records answer → clicks to stop
  3. POST /api/chat → transcript + follow-up question + TTS audio
  4. Follow-up spoken aloud and displayed in chat feed
  5. [Repeat from step 2 until user ends session]
    ↓
"End Interview" button → POST /api/feedback → navigate to /report/:sessionId
```

---

## Interview Setup (`/interview/setup`)

### Form Fields

| Field | Type | Options | Required |
|---|---|---|---|
| `job_role` | Select or text | "Software Engineering", "Data Science", "Product Management", "Marketing", "Finance", "Other (specify)" | Yes |
| `question_type` | Radio/Select | "Technical", "Behavioral", "Mixed" | Yes |
| `difficulty` | Radio/Select | "Easy", "Medium", "Hard" | Yes |
| `num_rounds` | Select | 3, 5, 10 | No (default: 5) |

### On Submit

1. Validate form with Zod
2. `INSERT into interview_sessions { user_id, job_role, question_type, difficulty, status: 'active' }`
3. Returns `session_id`
4. Navigate to `/interview/:sessionId`

---

## Active Interview Session (`/interview/[sessionId]`)

### Session Initialization

On page load:
1. Verify session exists and belongs to the current user (Supabase query)
2. Call `POST /api/start { job_role, question_type, difficulty }` → first question
3. Speak first question via TTS audio auto-play
4. Display first question in chat feed

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
FormData: { audio: Blob, current_question, session_id }
POST /api/chat
    ↓
[Response received]
- Save user_transcript + ai_response to Supabase (session_messages)
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
2. Show confirmation dialog: "Are you sure? Your session will end and you'll receive your feedback report."
3. On confirm:
   a. `POST /api/feedback` with full message history → FeedbackReport
   b. `INSERT into feedback_reports` (Supabase)
   c. `UPDATE interview_sessions SET status='completed', ended_at=now()`
   d. Navigate to `/report/:sessionId`

---

## Backend Calls

| Action | Endpoint | Notes |
|--------|----------|-------|
| Get first question | `POST /api/start` | Called on session page load |
| Submit answer | `POST /api/chat` | Called after each recording stop |
| Fetch TTS audio | `GET /api/audio/{filename}` | Fetched from `audio_url` in chat response |
| Generate feedback | `POST /api/feedback` | Called when user ends session |

---

## State (`store/interview-store.ts`)

```typescript
interface InterviewStore {
  sessionId: string | null
  currentQuestion: string
  messages: SessionMessage[]       // { role: 'user' | 'ai', content: string, audioUrl?: string }
  isRecording: boolean
  isLoading: boolean               // true while POST /api/chat is in-flight
  numRounds: number
  currentRound: number
  jobRole: string
  questionType: string
  difficulty: string

  // Actions
  setSession: (config: SessionConfig) => void
  addMessage: (message: SessionMessage) => void
  setRecording: (recording: boolean) => void
  setLoading: (loading: boolean) => void
  setCurrentQuestion: (question: string) => void
  reset: () => void
}
```

---

## Components

| Component | Location | Purpose |
|-----------|----------|---------|
| `SetupForm` | `components/features/interview/` | Interview configuration form with Zod validation |
| `MessageFeed` | `components/features/interview/` | Scrollable Q&A transcript display |
| `MicButton` | `components/features/interview/` | Recording trigger: idle / recording / loading states |
| `AudioPlayer` | `components/features/interview/` | Plays back TTS audio (wraps `<audio>` element) |
| `EndInterviewButton` | `components/features/interview/` | Triggers end-session confirmation dialog |
| `SessionProgress` | `components/features/interview/` | Shows round X of N indicator |

---

## Key Edge Cases

- **Microphone permission denied:** Show a persistent error state with instructions for enabling microphone access in browser settings. Do not silently fail.
- **Backend unreachable:** If `POST /api/chat` fails, show a retry option. Do not lose the current question — keep it displayed so the user can try again.
- **TTS audio blocked by browser:** Browsers require a user gesture before allowing programmatic audio playback. The "Start Interview" button click is used to play a silent audio buffer via the Web Audio API, which unlocks autoplay for the session. Subsequent `audio.play()` calls will succeed. If playback still fails (e.g. the user navigated away and back), the `<audio controls>` player rendered inside each AI message bubble acts as a fallback.
- **Page refresh during session:** The `sessionId` is in the URL. On re-load, fetch existing messages from `session_messages` (Supabase) and re-render the conversation. The session is resumable. The current in-flight audio is lost on refresh — that's acceptable.
- **Network timeout on audio upload:** Large audio files on slow connections may timeout. Set a generous fetch timeout (30s) and show a "still processing..." indicator after 5s.
