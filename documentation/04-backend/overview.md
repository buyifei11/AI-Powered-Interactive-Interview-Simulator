# Backend Overview

## What Backend Does

FastAPI backend handles Python-side interview pipeline:
- audio upload handling
- ASR transcription
- LLM response generation
- TTS generation
- role-based question retrieval via ChromaDB

Backend keeps active session state in memory (`GLOBAL_SESSIONS`). State resets on backend restart.

---

## Module Responsibilities

| Module | File | Responsibility |
|---|---|---|
| App & Routes | `main.py` | FastAPI setup, CORS, endpoints, in-memory session lifecycle, question/follow-up caps |
| ASR | `asr.py` | Transcribes uploaded audio via Groq Whisper |
| LLM | `llm.py` | Generates interviewer responses and final score summary; contains optional OpenAI vision path |
| TTS | `tts.py` | Converts AI response text to MP3 via ElevenLabs |
| RAG | `rag.py` | ChromaDB retrieval for role-scoped interview questions |

---

## Runtime Session Model

`/api/start` creates `GLOBAL_SESSIONS[session_id]` with:
- `job_role`
- `total_qs` (main question counter)
- `follow_ups` (follow-up counter)
- `history`
- `asked_questions`

`/api/chat` updates same session and enforces:
- max 2 follow-ups per main question
- max 10 main questions per interview

When cap reached, backend returns final score text with `completed: true` and removes session from memory.

`/api/end` supports explicit early termination and removes session from memory.

---

## Single Turn Lifecycle (`POST /api/chat`)

1. Save uploaded audio to `uploads/{session_id}_{uuid}.webm`
2. ASR transcription (`user_transcript`)
3. Update session history and counters
4. Generate interviewer response (or final score text at completion)
5. Generate TTS MP3 in `outputs/{session_id}_{uuid}.mp3`
6. Return `{ user_transcript, ai_response, audio_url, completed }`

Frontend then fetches audio via `GET /api/audio/{filename}`.

---

## Prompt Strategy (Current)

- **Normal turns:** concise interviewer-style evaluation + one follow-up question.
- **Final turn:** hiring-manager style summary with score out of 100 and hire/not-hire decision.

---

## Audio File Management

- **Uploads:** `backend/uploads/` (incoming blobs)
- **Outputs:** `backend/outputs/` (served TTS MP3 files)

Periodic cleanup for old output files still recommended (not implemented yet).

---

## ChromaDB Question Retrieval

`rag.py` seeds collection from `backend/data/starter_questions.json`.

`main.py:get_fresh_question()` retrieves role-matched candidates and filters duplicates/similar questions using cosine distance threshold.

---

## Deployment Notes

- Start command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
- `ffmpeg` must be available in runtime image.
- Update CORS `allow_origins` in `main.py` for production frontend origin.
