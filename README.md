# 🎙️ AI-Powered Interactive Interview Simulator

A **voice-first, multimodal AI interview practice platform**. Speak your answers aloud to a realistic AI interviewer, receive streaming real-time feedback, and get a scored final evaluation — all powered by a multi-model pipeline running in your browser and on a local FastAPI backend.

---

## ✨ Features

- 🎤 **Voice-driven Q&A** — Record answers via your microphone; audio is transcribed by Groq Whisper in real time
- 📸 **Webcam coaching** — Captures up to 5 frames per turn and sends them to GPT-4o-mini for facial-expression feedback woven naturally into the AI's response
- 🧠 **RAG question selection** — A 1,000+ question bank stored in ChromaDB; questions are retrieved by semantic similarity and deduplicated per session
- 🔄 **Streaming AI responses** — Tokens are streamed from Groq Llama via FastAPI `StreamingResponse` and rendered as a typewriter effect in the chat UI
- 🔊 **Neural TTS** — Every AI message is synthesised to audio with OpenAI TTS-1 (`nova` voice) and played back automatically
- 🎯 **Structured interview flow** — 10 main questions × up to 2 follow-ups each = up to 30 turns, ending with a scored final verdict (0–100, Hired / Not Hired)
- 🔐 **Auth & session management** — Supabase email/password auth with route-level middleware protection; user last name is injected into the AI's prompts for a personalised feel
- 🌙 **Dark / light mode** — Full theme toggle, glassmorphism UI, smooth animations

---

## 🏗️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | Next.js 16 (App Router), React 19, Tailwind CSS v4, shadcn/ui, TypeScript |
| **Backend** | FastAPI (Python), Uvicorn |
| **ASR (Speech → Text)** | Groq API — `whisper-large-v3` |
| **LLM (Evaluation & Chat)** | Groq API — `llama-3.1-8b-instant` (streaming) |
| **Vision (Facial Analysis)** | OpenAI API — `gpt-4o-mini` |
| **TTS (Text → Speech)** | OpenAI API — `tts-1` (voice: `nova`) |
| **Vector DB / RAG** | ChromaDB (persistent) + `all-MiniLM-L6-v2` sentence embeddings |
| **Auth & Database** | Supabase (PostgreSQL + SSR cookie auth) |

---

## 🧠 Pipeline Overview

Every user turn fires through **5 sequential stages**:

```
[1. Question Selection (RAG)]  →  [2. Text-to-Speech (TTS)]  →  [3. User Records Answer]
         ↑                                                                  ↓
[5. Session State & Turn Logic] ←─── [4. Three-Head Processing: ASR + Vision + LLM]
```

### Stage 1 — RAG Question Selection
- The 1,000+ question bank (`starter_questions.json`) is embedded via `all-MiniLM-L6-v2` and stored in ChromaDB with HNSW cosine-distance indexing.
- At question-selection time, a query like `"interview question for machine learning"` retrieves the top 50 semantically closest candidates.
- Already-asked questions and near-duplicates (cosine distance < 0.25) are filtered out.
- One question is chosen at random from the valid candidates.
- Supported roles: `software engineering`, `machine learning`, `data science`, `data analyst`.

### Stage 2 — Neural TTS
- The selected question text is passed to **OpenAI TTS-1** (`nova` voice) and saved as an MP3.
- The audio URL is returned to the frontend, which plays it automatically via `new Audio(url).play()`.
- TTS runs again for every AI follow-up response.

### Stage 3 — User Records Answer
- The browser opens `getUserMedia({ video: true, audio: true })` for mic + camera.
- Audio chunks (WebM format) are collected via `MediaRecorder`; webcam frames (base64 JPEG, 70% quality) are captured every **4 seconds** (max 4 frames) plus one final frame on stop.
- On stop, the audio blob and frames array are POSTed as `multipart/form-data` to `/api/chat`.

### Stage 4 — Three-Head Processing

**Head 1 — ASR (Whisper-large-v3 via Groq)**
- `ffmpeg` converts the incoming WebM to 16kHz mono MP3.
- The MP3 is sent to Groq's Whisper API and the transcript string is returned.

**Head 2 — Vision (GPT-4o-mini)**
- Up to 5 base64 frames are sent to GPT-4o-mini with a strict prompt asking for one specific sentence about the candidate's expression or eye direction.
- Generic or unclear results (`"calm and focused"`, `SKIP`) are discarded.
- The valid observation is injected into the LLM prompt as a labelled section.

**Head 3 — LLM Evaluation (Llama-3.1-8b-instant via Groq, streaming)**
- The system prompt includes role persona, evaluation rubric (Logic, Technical Depth, Communication), and CoT instructions.
- The user prompt injects: trimmed conversation history (last 4 exchanges), the current question, the ASR transcript, and — if available — the facial expression context.
- Tokens are streamed back via `StreamingResponse` and sent to the frontend as newline-delimited JSON events (`transcript` → `token` … → `done`).

### Stage 5 — Session State & Turn Logic

Server-side session dict tracks `total_qs` and `follow_ups` per session:

```
if total_qs > 10  OR  (total_qs == 10 AND follow_ups >= 2):
    → FINAL EVALUATION (full history → CoT scoring → Hired / Not Hired)
elif follow_ups >= 2:
    → TRANSITION  (praise → new RAG question → follow_ups reset → total_qs += 1)
else:
    → FOLLOW-UP   (probe a gap → follow_ups += 1)
```

A complete interview = **10 questions × (1 initial + 2 follow-ups) = up to 30 turns**, ending with a holistic verdict.

---

## 📁 Project Structure

```
AI-Powered-Interactive-Interview-Simulator/
├── backend/
│   ├── main.py              # FastAPI app — /api/start, /api/chat, /api/end, /api/audio
│   ├── rag.py               # ChromaDB init, question embedding & retrieval
│   ├── asr.py               # ffmpeg conversion + Groq Whisper transcription
│   ├── llm.py               # Groq streaming chat, GPT-4o-mini facial analysis, final eval
│   ├── tts.py               # OpenAI TTS-1 synthesis
│   ├── data/
│   │   ├── starter_questions.json   # 1,000+ interview questions with role/topic metadata
│   │   └── chroma_db/               # Persistent ChromaDB vector store (auto-created)
│   ├── uploads/             # Temporary WebM audio files (auto-cleaned)
│   ├── outputs/             # Generated MP3 files served via /api/audio
│   ├── requirements.txt
│   └── .env.example
└── frontend/
    ├── src/
    │   ├── app/
    │   │   ├── (app)/
    │   │   │   └── interview/page.tsx   # Main interview simulator (671-line client component)
    │   │   ├── (auth)/
    │   │   │   ├── login/               # Login page
    │   │   │   └── register/            # Registration page
    │   │   └── actions/auth.ts          # Supabase server actions (sign-in, sign-up, sign-out)
    │   ├── components/
    │   │   ├── app/AppTopbar.tsx        # Authenticated nav bar (logo, theme toggle, sign-out)
    │   │   ├── auth/                    # Auth form components
    │   │   ├── marketing/               # Landing page sections
    │   │   └── shared/ThemeToggle.tsx
    │   ├── lib/supabase/                # Browser & server Supabase clients
    │   └── middleware.ts                # Route protection + Supabase session refresh
    ├── package.json
    └── .env.local.example
```

---

## ⚙️ Prerequisites

- **Node.js 18+**
- **Python 3.9+**
- **ffmpeg** — required for audio conversion  
  ```bash
  brew install ffmpeg        # macOS
  apt-get install ffmpeg     # Debian/Ubuntu
  ```
- API keys (see environment setup below):
  - [Groq](https://console.groq.com) — ASR + LLM (free tier available)
  - [OpenAI](https://platform.openai.com) — Vision (GPT-4o-mini) + TTS
  - [Supabase](https://supabase.com) — Auth + database (free tier available)

---

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone <repo-url>
cd AI-Powered-Interactive-Interview-Simulator
```

---

### 2. Backend Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

Create your environment file:

```bash
cp .env.example .env
```

Open `backend/.env` and fill in all keys:

```env
GROQ_API_KEY=your_groq_api_key_here
OPENAI_API_KEY=your_openai_api_key_here
```

Start the backend (this also initialises and indexes ChromaDB on first run):

```bash
python main.py
```

Backend runs at **`http://localhost:8000`**. Visit `/docs` for the interactive API reference.

> **Note:** The first startup downloads the `all-MiniLM-L6-v2` embedding model (~80 MB) and indexes the question bank into ChromaDB. Subsequent starts are instant.

---

### 3. Frontend Setup

```bash
cd frontend
npm install
```

Create your frontend environment file:

```bash
cp .env.local.example .env.local   # or create .env.local manually
```

```env
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Start the dev server:

```bash
npm run dev
```

Frontend runs at **`http://localhost:3000`**.

---

## 🎬 Usage

1. Open [http://localhost:3000](http://localhost:3000) and create an account (or log in).
2. You'll be redirected to the **Interview** page.
3. Select your target role (Software Engineering, Machine Learning, Data Science, or Data Analyst).
4. Click **Start Session** — grant microphone + camera permissions when prompted.
5. Listen to the AI interviewer's opening question (played via TTS).
6. Click the **mic button** to start recording your answer; click again to stop and submit.
7. The AI evaluates your answer, streams a response with coaching feedback, and plays the audio.
8. After 10 questions (+ follow-ups), the AI delivers a final scored evaluation.

---

## 🔌 API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Health check — confirms backend is running |
| `POST` | `/api/start` | Start a new session; returns first question + audio URL |
| `POST` | `/api/chat` | Submit audio + video frames; streams transcript → tokens → done |
| `POST` | `/api/end` | End session early; returns final evaluation + audio URL |
| `GET` | `/api/audio/{filename}` | Serve generated MP3 files |

### `POST /api/start` — Request Body
```json
{ "job_role": "machine learning", "last_name": "Smith" }
```

### `POST /api/chat` — Form Data
| Field | Type | Description |
|---|---|---|
| `audio` | File (WebM) | Recorded answer audio |
| `current_question` | string | The question being answered |
| `session_id` | string | Session UUID from `/api/start` |
| `video_frames` | string (JSON array) | Optional base64-encoded JPEG frames |

### Streaming Response Events (`/api/chat`)
```jsonc
{"type": "transcript", "text": "..."}   // ASR result
{"type": "token",      "text": "..."}   // LLM stream chunk
{"type": "done", "audio_url": "/api/audio/...", "completed": false}
```

---

## 🔐 Authentication

- Supabase handles email/password auth with SSR cookie-based sessions.
- Next.js `middleware.ts` protects `/interview` and `/dashboard`; unauthenticated users are redirected to `/login`.
- Authenticated users visiting `/login` or `/register` are redirected to `/dashboard`.
- The user's `last_name` (stored in Supabase `user_metadata`) is automatically injected into AI prompts for personalised feedback.

---

## 🛠️ Development Notes

- **Session state is in-memory** (`GLOBAL_SESSIONS` dict in `main.py`). Sessions are lost on backend restart — this is intentional for a local-dev prototype.
- **Audio files** in `uploads/` and `outputs/` are not automatically purged. Delete them manually if disk space becomes a concern.
- The **vision head is optional** — if `OPENAI_API_KEY` is missing, TTS and vision are silently skipped; the LLM will still function using only the ASR transcript.
- The **LLM model** can be swapped by changing `DEFAULT_MODEL` in `llm.py` (any Groq-hosted model works).
- History is **trimmed to the last 4 exchanges** before each LLM call to stay within token limits.

---

## 📄 License

MIT
