import os
import shutil
import uuid
from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel
from dotenv import load_dotenv

load_dotenv()

import asr
import llm
import tts
import rag

app = FastAPI(title="AI Interview Simulator API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Ensure upload/output directories exist
os.makedirs("uploads", exist_ok=True)
os.makedirs("outputs", exist_ok=True)

class StartInterviewRequest(BaseModel):
    job_role: str = "software engineering"

@app.get("/api/health")
async def health_check():
    return {"status": "ok", "message": "Backend is running and models are loaded."}

@app.post("/api/start")
async def start_interview(req: StartInterviewRequest):
    """
    Initializes a new interview session and returns the first question.
    """
    # Simply grab the first document from the mock dataset or from RAG
    # We query RAG lazily for something relevant
    res = rag.query_questions(f"initial intro question for {req.job_role}")
    if res and res['documents'] and len(res['documents'][0]) > 0:
        first_q = res['documents'][0][0]
    else:
        first_q = "Could you tell me a little bit about yourself and your background?"
        
    return {"question": first_q, "session_id": str(uuid.uuid4())}

@app.post("/api/chat")
def chat(
    audio: UploadFile = File(...),
    current_question: str = Form(...),
    session_id: str = Form(...)
):
    """
    Receives user audio and the current question.
    Returns transcription, AI follow-up, and a link to the TTS audio file.
    """
    # 1. Save uploaded audio
    audio_filename = f"uploads/{session_id}_{uuid.uuid4()}.webm"
    with open(audio_filename, "wb") as buffer:
        shutil.copyfileobj(audio.file, buffer)
        
    # 2. Transcribe Audio
    user_transcript = asr.transcribe_audio(audio_filename)
    
    # 3. Evaluate and Generate
    eval_result = llm.evaluate_answer(current_question, user_transcript)
    ai_response_text = eval_result["evaluation_and_followup"]
    
    # 4. Synthesize Speech
    tts_output_filename = f"outputs/{session_id}_{uuid.uuid4()}.mp3"
    tts.text_to_speech(ai_response_text, tts_output_filename)
    
    return {
        "user_transcript": user_transcript,
        "ai_response": ai_response_text,
        "audio_url": f"/api/audio/{os.path.basename(tts_output_filename)}"
    }

@app.get("/api/audio/{filename}")
async def get_audio(filename: str):
    file_path = f"outputs/{filename}"
    return FileResponse(file_path, media_type="audio/mpeg")

if __name__ == "__main__":
    import uvicorn
    # Make sure DB is initialized
    rag.init_db()
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
