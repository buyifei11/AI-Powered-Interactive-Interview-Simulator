import os
import random
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

os.makedirs("uploads", exist_ok=True)
os.makedirs("outputs", exist_ok=True)

class StartInterviewRequest(BaseModel):
    job_role: str = "software engineering"
    last_name: str = ""

class EndInterviewRequest(BaseModel):
    session_id: str

# In-memory session store (prototype use only)
GLOBAL_SESSIONS = {}

MAX_MAIN_QUESTIONS = 10
SIMILARITY_THRESHOLD = 0.25  # Cosine distance below this means "too similar" (0 = identical, 1 = orthogonal)

def get_fresh_question(job_role: str, asked_questions: list) -> str:
    """
    Query RAG for candidate questions, filter out already-asked or too-similar
    ones, then randomly select from the remaining valid pool.
    """
    collection = rag.get_retriever()
    try:
        count = collection.count()
        res = collection.query(
            query_texts=[f"interview question for {job_role}"],
            n_results=min(50, count),
            where={"$or": [{"job_role": job_role}, {"job_role": "any"}]}
        )
    except Exception:
        return "Could you describe a challenging project you recently worked on?"

    candidates = res["documents"][0] if res and res["documents"] else []

    if not candidates:
        return "Could you describe a challenging project you recently worked on?"

    # Collect all valid candidates first, then pick randomly
    valid = []
    for candidate in candidates:
        if candidate in asked_questions:
            continue
        too_similar = False
        for asked in asked_questions:
            try:
                sim_res = collection.query(query_texts=[asked], n_results=1)
                if sim_res and sim_res["documents"][0]:
                    top_doc = sim_res["documents"][0][0]
                    top_dist = sim_res["distances"][0][0]
                    if top_doc == candidate and top_dist < SIMILARITY_THRESHOLD:
                        too_similar = True
                        break
            except Exception:
                pass
        if not too_similar:
            valid.append(candidate)

    if valid:
        return random.choice(valid)

    return "Can you walk me through a project where you had significant technical ownership?"


@app.get("/api/health")
async def health_check():
    return {"status": "ok", "message": "Backend is running and models are loaded."}

@app.post("/api/start")
async def start_interview(req: StartInterviewRequest):
    """
    Initializes a new interview session and returns the first question.
    """
    first_q = get_fresh_question(req.job_role, [])
    session_id = str(uuid.uuid4())
    
    GLOBAL_SESSIONS[session_id] = {
        "job_role": req.job_role,
        "last_name": req.last_name,
        "total_qs": 1,
        "follow_ups": 0,
        "history": f"AI: {first_q}\n",
        "asked_questions": [first_q],
    }
        
    return {"question": first_q, "session_id": session_id}

@app.post("/api/end")
async def end_interview(req: EndInterviewRequest):
    ended = GLOBAL_SESSIONS.pop(req.session_id, None) is not None
    return {"success": True, "ended": ended}

@app.post("/api/chat")
def chat(
    audio: UploadFile = File(...),
    current_question: str = Form(...),
    session_id: str = Form(...),
    video_frame: str = Form(None)
):
    session = GLOBAL_SESSIONS.get(session_id, {
        "job_role": "software engineering",
        "last_name": "",
        "total_qs": 1,
        "follow_ups": 0,
        "history": f"AI: {current_question}\n",
        "asked_questions": [current_question],
    })
    
    audio_filename = f"uploads/{session_id}_{uuid.uuid4()}.webm"
    with open(audio_filename, "wb") as buffer:
        shutil.copyfileobj(audio.file, buffer)
        
    user_transcript = asr.transcribe_audio(audio_filename)
    session["history"] += f"User: {user_transcript}\n"
    
    # Termination: user just answered the 10th main question → generate final score
    if session["total_qs"] >= MAX_MAIN_QUESTIONS:
        final_score_text = llm.generate_final_score(session["history"], candidate_name=session.get("last_name", ""))
        tts_output_filename = f"outputs/{session_id}_final.mp3"
        tts.text_to_speech(final_score_text, tts_output_filename)
        GLOBAL_SESSIONS.pop(session_id, None)
        return {
            "user_transcript": user_transcript,
            "ai_response": final_score_text,
            "audio_url": f"/api/audio/{os.path.basename(tts_output_filename)}",
            "completed": True
        }
    
    # Follow-up limit: max 2 follow-ups per main question
    candidate_name = session.get("last_name", "")
    name_ref = f" {candidate_name}," if candidate_name else ","
    if session["follow_ups"] >= 2:
        prompt = (
            f"Question: {current_question}\n\n"
            f"Candidate's answer: {user_transcript}\n\n"
            f"Give 1-2 sentences of warm, specific feedback on this answer addressing the candidate as '{candidate_name}' if it feels natural. "
            "Do NOT ask another question. Close with a brief natural transition like 'Let's move on to the next one.'"
        )
        feedback = llm.generate_response(prompt, system_prompt="You are a warm, experienced technical interviewer giving conversational feedback.")
        
        job_role = session["job_role"]
        asked = session.get("asked_questions", [])
        new_q = get_fresh_question(job_role, asked)
        
        session["asked_questions"].append(new_q)
        session["follow_ups"] = 0
        session["total_qs"] += 1
        ai_response_text = f"{feedback}\n\n**Question {session['total_qs']} of {MAX_MAIN_QUESTIONS}:** {new_q}"
    else:
        eval_result = llm.evaluate_answer(current_question, user_transcript, image_base64=None, candidate_name=candidate_name)
        ai_response_text = eval_result["evaluation_and_followup"]
        session["follow_ups"] += 1

    session["history"] += f"AI: {ai_response_text}\n"
    
    tts_output_filename = f"outputs/{session_id}_{uuid.uuid4()}.mp3"
    tts.text_to_speech(ai_response_text, tts_output_filename)
    
    GLOBAL_SESSIONS[session_id] = session
    
    return {
        "user_transcript": user_transcript,
        "ai_response": ai_response_text,
        "audio_url": f"/api/audio/{os.path.basename(tts_output_filename)}",
        "completed": False
    }

@app.get("/api/audio/{filename}")
async def get_audio(filename: str):
    file_path = f"outputs/{filename}"
    return FileResponse(file_path, media_type="audio/mpeg")

if __name__ == "__main__":
    import uvicorn
    rag.init_db()
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
