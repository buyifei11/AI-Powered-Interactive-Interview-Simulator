# AI-Powered Interactive Interview Simulator

An AI-driven interview simulator that listens to your voice answers, evaluates them in real-time using a large language model, and asks intelligent follow-up questions — all spoken back to you.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js (React) |
| Backend | FastAPI (Python) |
| Speech-to-Text (ASR) | Groq API — `whisper-large-v3` |
| Language Model (LLM) | Groq API — `llama-3.1-8b-instant` |
| Text-to-Speech (TTS) | macOS `say` command (via `ffmpeg`) |
| Vector DB (RAG) | ChromaDB |

## Setup Instructions

### Prerequisites
- Python 3.9+
- Node.js 18+
- macOS (required for the built-in TTS `say` command)
- `ffmpeg` installed via Homebrew: `brew install ffmpeg`
- A free **Groq API Key** from [console.groq.com](https://console.groq.com)

---

### 1. Clone the Repository
```bash
git clone https://github.com/buyifei11/AI-Powered-Interactive-Interview-Simulator.git
cd AI-Powered-Interactive-Interview-Simulator
```

### 2. Configure Environment Variables
```bash
cd backend
cp .env.example .env
```
Open `backend/.env` and replace `your_groq_api_key_here` with your actual Groq API key.

### 3. Start the Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python main.py
```
The backend will start at `http://localhost:8000`.

### 4. Start the Frontend
```bash
cd frontend
npm install
npm run dev
```
The frontend will start at `http://localhost:3000`.

---

## Usage

1. Open [http://localhost:3000](http://localhost:3000) in your browser.
2. Click **"Start Interview"** to begin a session.
3. Click the **microphone button** to start recording your answer.
4. Click it again to **stop and submit** your answer.
5. The AI will evaluate your response and ask a follow-up question, both in text and spoken audio.