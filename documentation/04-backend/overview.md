# Backend Overview

## What the Backend Does

The FastAPI backend is the AI processing layer. It handles everything that requires Python: audio conversion, speech-to-text transcription, LLM inference, and text-to-speech synthesis. It is stateless — it does not own a database. All session state is persisted by the frontend into Supabase.

The backend is intentionally scoped: it receives audio and text in, returns text and audio out. It does not authenticate users or manage sessions beyond processing a single request.

---

## Module Responsibilities

| Module | File | Responsibility |
|---|---|---|
| App & Routes | `main.py` | FastAPI app setup, CORS config, endpoint registration, temp file directory creation |
| ASR | `asr.py` | Converts uploaded audio (`.webm`) to `.mp3` via ffmpeg, then transcribes via Groq Whisper |
| LLM | `llm.py` | Calls Groq LLaMA for two purposes: (1) follow-up question generation during interview, (2) full feedback report generation after session ends |
| TTS | `tts.py` | Converts AI response text to an MP3 audio file via ElevenLabs API |
| RAG | `rag.py` | Manages ChromaDB vector store of interview questions; retrieves semantically relevant questions for a given job role and topic |

---

## Request Lifecycle (Single Interview Turn)

```
1. Browser → POST /api/chat (multipart: audio blob + metadata)
2. main.py saves blob to disk: uploads/{session_id}_{uuid}.webm
3. asr.py:
   a. ffmpeg converts .webm → .mp3 (16kHz mono, 64k bitrate)
   b. Groq Whisper API → user_transcript: str
   c. Cleans up .mp3 temp file
4. llm.py:
   a. Builds prompt: question + user_transcript
   b. System prompt: interviewer persona, NO evaluation, ONE follow-up question
   c. Groq LLaMA → follow_up_question: str
5. tts.py:
   a. ElevenLabs API → MP3 binary
   b. Saves to outputs/{session_id}_{uuid}.mp3
6. main.py returns JSON: { user_transcript, ai_response, audio_url }
7. Browser fetches audio_url → GET /api/audio/{filename}
8. main.py serves the MP3 from outputs/
```

---

## LLM Prompt Design

### During Interview (Follow-up Generation)

The LLM prompt is designed to suppress any evaluation or scoring:

```
System: You are a professional technical interviewer conducting a mock interview.
        Your role is to ask ONE concise follow-up question based on the candidate's answer.
        Do NOT evaluate the answer. Do NOT provide feedback. Do NOT score the candidate.
        Keep follow-up questions focused, conversational, and relevant.

User:   Question: {current_question}
        Candidate's Answer: {user_transcript}

        Ask exactly one follow-up question.
```

### After Session (Feedback Report Generation)

```
System: You are an expert interview coach. Analyze the complete interview transcript
        and provide a structured feedback report.

User:   Job Role: {job_role}
        Interview Type: {question_type}

        Full Transcript:
        {formatted_transcript}

        Provide scores (1-10) for: clarity, structure, relevance, confidence.
        Provide 3-5 specific, actionable improvement suggestions.
        Provide an overall rating (1-10).
        Respond in valid JSON matching the FeedbackReport schema.
```

---

## Audio File Management

Temporary audio files are created and cleaned up during request processing:

- **Uploads directory:** `backend/uploads/` — stores incoming `.webm` files during transcription
- **Outputs directory:** `backend/outputs/` — stores generated TTS `.mp3` files served to the browser

**Cleanup policy (planned):**
- Uploaded `.webm` and converted `.mp3` files are deleted immediately after transcription.
- TTS output `.mp3` files are served on demand and should be cleaned up on a schedule (e.g. files older than 1 hour). This cleanup job is not yet implemented.

---

## ChromaDB Question Bank

The RAG module (`rag.py`) maintains a ChromaDB collection of interview questions. On startup (`main.py → rag.init_db()`), the collection is seeded from `data/starter_questions.json`.

**Current question bank:** 4 questions (2 software engineering, 1 data science, 1 behavioral). This needs significant expansion before launch.

**Question schema in JSON:**

```json
{
  "id": 1,
  "job_role": "software engineering",
  "topic": "Python",
  "difficulty": "medium",
  "question": "Can you explain the difference between a list and a tuple in Python?",
  "type": "technical"
}
```

**Query:** `rag.query_questions(query_text, n_results=2)` returns the most semantically relevant questions for a given input string (e.g. `"initial intro question for software engineering"`).

---

## Deployment (Railway)

The backend deploys to Railway as a Python/Docker service.

**Required in Railway environment:**
- All backend env vars (see [`03-setup/environment-variables.md`](../03-setup/environment-variables.md))
- ffmpeg must be available — Railway's nixpacks builder installs it from `nixpacks.toml` or a `Procfile` with apt install

**Nixpacks config (planned — `backend/nixpacks.toml`):**

```toml
[phases.setup]
nixPkgs = ["ffmpeg"]
```

**Start command:** `uvicorn main:app --host 0.0.0.0 --port $PORT`

---

## CORS Configuration

The backend allows requests from the frontend origin only:

```python
allow_origins=["http://localhost:3000"]  # dev
# Production: ["https://your-app.vercel.app"]
```

Update `allow_origins` in `main.py` before deploying to production to include the Vercel production URL.
