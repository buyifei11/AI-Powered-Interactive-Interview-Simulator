# AI Interview Simulator

A voice-first AI interview practice platform. Speak your answers to an AI interviewer, receive intelligent follow-up questions, and get a comprehensive feedback report when your session ends.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16 (App Router), React 19, Tailwind v4, shadcn/ui |
| Backend | FastAPI (Python) |
| ASR (Speech-to-Text) | Groq API — `whisper-large-v3` |
| LLM | Groq API — `llama-3.1-8b-instant` |
| TTS (Text-to-Speech) | ElevenLabs API |
| Vector DB (RAG) | ChromaDB |
| Auth & Database | Supabase (PostgreSQL) |

## Full Documentation

All architecture decisions, feature specs, setup guides, and design system docs live in [`documentation/`](./documentation/README.md). Read that first for a full picture.

---

## Quick Start

### Prerequisites

- Node.js 18+
- Python 3.9+
- `ffmpeg` — `brew install ffmpeg` (macOS) or `apt-get install ffmpeg` (Linux)
- A free **Groq API key** from [console.groq.com](https://console.groq.com)
- An **ElevenLabs API key** from [elevenlabs.io](https://elevenlabs.io)

### 1. Clone the Repository

```bash
git clone <repo-url>
cd AI-Powered-Interactive-Interview-Simulator
```

### 2. Configure Environment Variables

```bash
cd backend
cp .env.example .env
```

Open `backend/.env` and fill in:

```env
GROQ_API_KEY=your_groq_api_key_here
ELEVENLABS_API_KEY=your_elevenlabs_api_key_here
ELEVENLABS_VOICE_ID=21m00Tcm4TlvDq8ikWAM
```

### 3. Start the Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
python main.py
```

Backend runs at `http://localhost:8000`. Visit `/docs` for the API reference.

### 4. Start the Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at `http://localhost:3000`.

---

## Usage

1. Open [http://localhost:3000](http://localhost:3000) — you'll see the landing page.
2. Click **"Start practicing free"** to go to the interview page.
3. Click **"Start Interview"** to connect to the AI interviewer.
4. Click the **microphone button** to record your answer, then click again to submit.
5. The AI will respond with a follow-up question, displayed as text and played as audio.

For detailed setup (Supabase, environment variables, deployment), see [`documentation/03-setup/getting-started.md`](./documentation/03-setup/getting-started.md).
