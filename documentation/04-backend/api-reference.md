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
  "job_role": "software engineering",
  "question_type": "technical",
  "difficulty": "medium"
}
```

| Field | Type | Required | Default | Notes |
|---|---|---|---|---|
| `job_role` | string | No | `"software engineering"` | Used to query the RAG question bank |
| `question_type` | string | No | `"technical"` | `"technical"` \| `"behavioral"` \| `"mixed"` |
| `difficulty` | string | No | `"medium"` | `"easy"` \| `"medium"` \| `"hard"` |

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
1. Queries ChromaDB RAG with `"initial intro question for {job_role}"`.
2. Returns the top result. Falls back to a hardcoded intro question if RAG returns nothing.
3. Generates a new `session_id` UUID.

**Used by:** Frontend — on "Start Interview" button click, after interview setup form submission.

---

## `POST /api/chat`

Processes one interview turn: receives user audio, transcribes it, generates a follow-up question, and synthesizes a TTS response.

**Request:** `multipart/form-data`

| Field | Type | Required | Notes |
|---|---|---|---|
| `audio` | File | Yes | Audio recording from browser (`.webm` format from MediaRecorder API) |
| `current_question` | string | Yes | The question that was just asked to the user |
| `session_id` | string | Yes | Session ID returned by `/api/start` |

**Response:**

```json
{
  "user_transcript": "I have been working as a software engineer for three years...",
  "ai_response": "That's great. Can you tell me more about a specific project where you had to solve a particularly complex technical challenge?",
  "audio_url": "/api/audio/abc123_uuid.mp3"
}
```

| Field | Type | Notes |
|---|---|---|
| `user_transcript` | string | Whisper transcription of the user's audio answer |
| `ai_response` | string | LLaMA-generated follow-up question (no evaluation, no scores) |
| `audio_url` | string | Relative path to the TTS audio file. Fetch via `GET /api/audio/{filename}` |

**Backend logic:**
1. Saves audio blob to `uploads/{session_id}_{uuid}.webm`
2. Converts `.webm` → `.mp3` via ffmpeg
3. Transcribes `.mp3` via Groq Whisper → `user_transcript`
4. Calls Groq LLaMA with interviewer system prompt → `ai_response`
5. Calls ElevenLabs TTS → saves MP3 to `outputs/{session_id}_{uuid}.mp3`
6. Cleans up temp upload files
7. Returns response

**Error cases:**

| HTTP Status | When |
|---|---|
| `400` | Audio file is empty or too short |
| `500` | ffmpeg conversion failed, Groq API error, ElevenLabs API error |

**Used by:** Frontend — after user stops recording their answer.

---

## `POST /api/feedback` _(planned)_

Generates the post-session feedback report from the full interview transcript.

**Request body (JSON):**

```json
{
  "session_id": "550e8400-e29b-41d4-a716-446655440000",
  "job_role": "software engineering",
  "question_type": "technical",
  "messages": [
    { "role": "ai", "content": "Tell me about yourself." },
    { "role": "user", "content": "I have been working as a software engineer for three years..." },
    { "role": "ai", "content": "What was your biggest technical challenge?" },
    { "role": "user", "content": "I once had to migrate a monolith to microservices..." }
  ]
}
```

| Field | Type | Required | Notes |
|---|---|---|---|
| `session_id` | string | Yes | Used for logging/tracing |
| `job_role` | string | Yes | Context for the LLM feedback prompt |
| `question_type` | string | Yes | `"technical"` \| `"behavioral"` \| `"mixed"` |
| `messages` | array | Yes | Full ordered Q&A transcript (role + content pairs) |

**Response:**

```json
{
  "overall_rating": 7,
  "clarity_score": 8,
  "structure_score": 6,
  "relevance_score": 7,
  "confidence_score": 7,
  "suggestions": [
    "Use the STAR method (Situation, Task, Action, Result) to structure behavioral answers more clearly.",
    "Provide more specific metrics when describing achievements — e.g. 'reduced load time by 40%' rather than 'made it faster'.",
    "Slow down when explaining technical concepts — your pacing was fast on the microservices answer."
  ],
  "transcript_summary": "The candidate demonstrated solid foundational knowledge of distributed systems and Python. Answers were generally relevant but lacked structured storytelling in behavioral questions."
}
```

**Backend logic:**
1. Formats the full transcript into a structured prompt.
2. Calls Groq LLaMA with the feedback report system prompt.
3. Parses LLM response as JSON (with fallback if parsing fails).
4. Returns the structured `FeedbackReport` object.

**Used by:** Frontend — when user clicks "End Interview".

---

## `GET /api/audio/{filename}`

Serves a generated TTS audio file.

**Request:** No body. `filename` is the basename of the file (e.g. `abc123_uuid.mp3`).

**Response:** Binary MP3 file with `Content-Type: audio/mpeg`.

**Used by:** Frontend — `<audio src="/api/audio/{filename}">` or `new Audio(url).play()`.

> **Note:** Files in `outputs/` are temporary. A cleanup job (not yet implemented) should remove files older than ~1 hour to prevent disk buildup on the Railway instance.
