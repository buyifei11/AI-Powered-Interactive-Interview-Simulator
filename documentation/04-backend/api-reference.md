# API Reference

Base URL:
- **Local:** `http://localhost:8000`
- **Production:** `https://<your-railway-service>.up.railway.app`

All endpoints return JSON unless specified otherwise (audio file endpoint returns binary).

---

## `GET /api/health`

Health check. Used by the frontend to verify the backend is running before starting an interview.

**Request:** No parameters.

**Response:**

```json
{
  "status": "ok",
  "message": "Backend is running and models are loaded."
}
```

**Used by:** Frontend — on app load or before starting an interview session.

---

## `POST /api/start`

Initializes a new interview session and returns the first question.

**Request body (JSON):**

```json
{
  "job_role": "software engineering"
}
```

| Field | Type | Required | Default | Notes |
|---|---|---|---|---|
| `job_role` | string | No | `"software engineering"` | Used to query the RAG question bank |

**Response:**

```json
{
  "question": "Can you tell me about yourself and your background?",
  "session_id": "550e8400-e29b-41d4-a716-446655440000"
}
```

| Field | Type | Notes |
|---|---|---|
| `question` | string | The first interview question to display and speak to the user |
| `session_id` | string | UUID generated server-side. Frontend must pass this in all subsequent `/api/chat` calls |

**Backend logic:**
1. Queries ChromaDB RAG for role-scoped first question.
2. Creates in-memory session state (`job_role`, `total_qs`, `follow_ups`, `history`, `asked_questions`).
3. Returns first question + generated `session_id` UUID.

**Used by:** Frontend — on "Start Interview" button click, after interview setup form submission.

---

## `POST /api/chat`

Processes one interview turn: receives user audio, transcribes it, generates interview response, and synthesizes TTS audio.

**Request:** `multipart/form-data`

| Field | Type | Required | Notes |
|---|---|---|---|
| `audio` | File | Yes | Audio recording from browser (`.webm` format from MediaRecorder API) |
| `current_question` | string | Yes | The question that was just asked to the user |
| `session_id` | string | Yes | Session ID returned by `/api/start` |
| `video_frame` | string | No | Base64 JPEG frame captured from webcam (`dataUrl.split(",")[1]`) |

**Response:**

```json
{
  "user_transcript": "I have been working as a software engineer for three years...",
  "ai_response": "Great context. Can you walk me through your design choices on that project?",
  "audio_url": "/api/audio/abc123_uuid.mp3",
  "completed": false
}
```

| Field | Type | Notes |
|---|---|---|
| `user_transcript` | string | Whisper transcription of the user's audio answer |
| `ai_response` | string | Interviewer response (follow-up or final score summary) |
| `audio_url` | string | Relative path to the TTS audio file. Fetch via `GET /api/audio/{filename}` |
| `completed` | boolean | `true` when session hits main-question cap and final score is returned |

**Backend logic:**
1. Saves audio blob to `uploads/{session_id}_{uuid}.webm`
2. Transcribes audio via Groq Whisper → `user_transcript`
3. Uses in-memory counters:
   - max 2 follow-ups per main question
   - max 10 main questions total
4. If max reached, generates final score summary, returns `completed: true`, clears session.
5. Otherwise generates next response, synthesizes TTS, returns `completed: false`.

**Error cases:**

| HTTP Status | When |
|---|---|
| `400` | Audio file is empty or too short |
| `500` | ffmpeg conversion failed, Groq API error, ElevenLabs API error |

**Used by:** Frontend — after user stops recording their answer.

---

## `POST /api/end`

Ends interview session early and clears in-memory session state.

**Request body (JSON):**

```json
{
  "session_id": "550e8400-e29b-41d4-a716-446655440000"
}
```

| Field | Type | Required | Notes |
|---|---|---|---|
| `session_id` | string | Yes | Session ID returned by `/api/start` |

**Response:**

```json
{
  "success": true,
  "ended": true
}
```

**Backend logic:**
1. Removes session from `GLOBAL_SESSIONS` by `session_id`.
2. Returns whether session existed.

**Used by:** Frontend — on explicit "End Interview" confirm or navigation-away confirmation.

---

## `GET /api/audio/{filename}`

Serves a generated TTS audio file.

**Request:** No body. `filename` is the basename of the file (e.g. `abc123_uuid.mp3`).

**Response:** Binary MP3 file with `Content-Type: audio/mpeg`.

**Used by:** Frontend — `<audio src="/api/audio/{filename}">` or `new Audio(url).play()`.

> **Note:** Files in `outputs/` are temporary. A cleanup job (not yet implemented) should remove files older than ~1 hour to prevent disk buildup on the Railway instance.
