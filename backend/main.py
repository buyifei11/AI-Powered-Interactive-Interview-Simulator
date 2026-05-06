import os
import random
import shutil
import uuid
import json
from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, StreamingResponse
from pydantic import BaseModel
from dotenv import load_dotenv

load_dotenv()

import asr
import llm
import tts
import rag

app = FastAPI(title="AI Interview Simulator API")

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

GLOBAL_SESSIONS = {}

MAX_MAIN_QUESTIONS = 10
SIMILARITY_THRESHOLD = 0.25

def get_fresh_question(job_role: str, asked_questions: list) -> str:
    collection = rag.get_retriever()
    # Deep Dive questions (referencing 'that project') don't work as standalone main questions
    EXCLUDED_TOPICS = {"Deep Dive"}
    try:
        count = collection.count()
        res = collection.query(
            query_texts=[f"interview question for {job_role}"],
            n_results=min(50, count),
            where={"$or": [{"job_role": job_role}, {"job_role": "any"}]}
        )
    except Exception:
        return "Could you describe a challenging project you recently worked on?"

    candidates_raw = res["documents"][0] if res and res["documents"] else []
    metadatas_raw = res["metadatas"][0] if res and res["metadatas"] else []
    if not candidates_raw:
        return "Could you describe a challenging project you recently worked on?"

    # Filter out Deep Dive topic questions
    candidates = [
        doc for doc, meta in zip(candidates_raw, metadatas_raw)
        if meta.get("topic") not in EXCLUDED_TOPICS
    ]
    if not candidates:
        candidates = candidates_raw  # fallback if all were filtered

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


def get_trimmed_history(history: str, max_exchanges: int = 4) -> str:
    """Return the last N AI+User exchange pairs to keep prompts within token limits."""
    lines = [l for l in history.strip().split("\n") if l.strip()]
    # Each exchange = 1 AI line + 1 User line = 2 lines. Keep last max_exchanges exchanges.
    keep = max_exchanges * 2
    if len(lines) > keep:
        trimmed = lines[-keep:]
        return "[Earlier history truncated for brevity]\n" + "\n".join(trimmed)
    return history


@app.get("/api/health")
async def health_check():
    return {"status": "ok", "message": "Backend is running and models are loaded."}

@app.post("/api/start")
async def start_interview(req: StartInterviewRequest):
    first_q = get_fresh_question(req.job_role, [])
    session_id = str(uuid.uuid4())
    
    tts_output_filename = f"outputs/{session_id}_first.mp3"
    tts.text_to_speech(first_q, tts_output_filename)
    
    GLOBAL_SESSIONS[session_id] = {
        "job_role": req.job_role,
        "last_name": req.last_name,
        "total_qs": 1,
        "follow_ups": 0,
        "history": f"AI: {first_q}\n",
        "asked_questions": [first_q],
    }
    return {
        "question": first_q, 
        "session_id": session_id,
        "audio_url": f"/api/audio/{os.path.basename(tts_output_filename)}"
    }

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

    candidate_name = session.get("last_name", "")
    is_completed = session["total_qs"] > MAX_MAIN_QUESTIONS or (session["total_qs"] == MAX_MAIN_QUESTIONS and session["follow_ups"] >= 2)
    question_suffix = ""
    increment_followup = False

    if is_completed:
        name_line = f"The candidate's name is {candidate_name}. " if candidate_name else ""
        sys_prompt = (
            "You are the hiring manager wrapping up an interview. "
            f"{name_line}"
            "Speak directly to the candidate in a warm, honest tone — as if giving feedback face to face. "
            "Highlight their genuine strengths and areas to work on across three dimensions: "
            "1. Logic & Problem Solving, 2. Technical Competency, 3. Communication.\n"
            "End with a final score out of 100 and a clear decision: Hired or Not Hired."
        )
        prompt = (
            f"Here is the full interview transcript:\n{session['history']}\n\n"
            "Please give your closing feedback, score, and decision."
        )
    elif session["follow_ups"] >= 2:
        sys_prompt = (
            "You are a warm, experienced technical interviewer giving conversational feedback. "
            "You must acknowledge the candidate's latest answer and then transition to a new topic.\n\n"
            "IMPORTANT: Prioritize the specific facts, numbers, and hypothetical constraints provided in the question "
            "over general rules (e.g., the 68-95-99.7 rule) if they conflict. If a candidate follows the question's premise, they are correct."
        )
        prompt = (
            f"Recent Interview History:\n{get_trimmed_history(session['history'])}\n"
            f"LATEST Question: {current_question}\n\n"
            f"Candidate LATEST Answer: {user_transcript}\n\n"
            f"Give 2-3 sentences of warm feedback. Address the candidate as '{candidate_name}' if it feels natural. "
            "Mention one highlight from their LATEST answer. "
            "CRITICAL: Output NO questions at all. The next question will appear automatically after your response. "
            "End with a brief transition like 'Let\'s move on to the next one.'"
        )
        new_q = get_fresh_question(session["job_role"], session.get("asked_questions", []))
        session["asked_questions"].append(new_q)
        session["follow_ups"] = 0
        session["total_qs"] += 1
        question_suffix = f"\n\n**Question {session['total_qs']} of {MAX_MAIN_QUESTIONS}:** {new_q}"
    else:
        name_clause = f"Address the candidate as '{candidate_name}' once if it feels natural. " if candidate_name else ""
        common_instructions = (
            "You must evaluate the candidate's latest answer across three dimensions: 1. Logic, 2. Technical Depth, 3. Communication.\n"
            "IMPORTANT: Prioritize the specific facts, numbers, and hypothetical constraints provided in the question "
            "over general rules (e.g., the 68-95-99.7 rule) if they conflict. If a candidate follows the question's premise, they are correct.\n"
            "React naturally: acknowledge a strength in one of these areas, probe a gap, and show genuine curiosity."
        )
        if video_frame:
            sys_prompt = (
                "You are an expert AI interview coach. "
                "This session is conducted with the candidate's explicit consent to webcam-based coaching.\n"
                + common_instructions + "\n"
                "You will be provided with a [Facial Expression Context] based on their webcam feed. "
                "Weave ONE short supportive sentence about their presence naturally into your response — "
                "do NOT use any prefix or label like 'Non-verbal coaching feedback:'. "
                "Do NOT repeat the facial observation more than once.\n"
                f"{name_clause}Finish with exactly one concise follow-up question. Do NOT add more than one question."
            )
        else:
            sys_prompt = (
                "You are an expert technical interviewer having a real conversation.\n"
                + common_instructions + "\n"
                f"{name_clause}Finish with exactly one concise follow-up question."
            )
        prompt = (
            f"Recent Interview History:\n{get_trimmed_history(session['history'])}\n"
            f"LATEST Question Asked: {current_question}\n\n"
            f"Candidate LATEST Answer: {user_transcript}\n\n"
            "React naturally to the LATEST answer. "
            "CRITICAL: End with EXACTLY ONE follow-up question. Do NOT ask two questions."
        )
        increment_followup = True

    def generate():
        yield json.dumps({"type": "transcript", "text": user_transcript}) + "\n"

        full_text = ""
        try:
            final_prompt = prompt
            if video_frame and increment_followup:
                facial_context = llm.analyze_facial_expression(video_frame)
                if facial_context:
                    final_prompt += (
                        f"\n\n[Facial Expression Context — use this exactly once, inline, with NO label or prefix]: {facial_context}\n"
                        "You MUST mention this observation naturally in ONE sentence within your response. "
                        "Do NOT write 'Non-verbal coaching feedback:' or repeat it."
                    )
            
            for chunk in llm.stream_chat(final_prompt, sys_prompt):
                token = chunk.choices[0].delta.content or ""
                if token:
                    full_text += token
                    yield json.dumps({"type": "token", "text": token}) + "\n"
        except Exception as e:
            print(f"Error in stream generation: {e}")
            yield json.dumps({"type": "error", "text": str(e)}) + "\n"
            return

        if question_suffix:
            full_text += question_suffix
            yield json.dumps({"type": "token", "text": question_suffix}) + "\n"

        if increment_followup:
            session["follow_ups"] += 1

        session["history"] += f"AI: {full_text}\n"
        if is_completed:
            GLOBAL_SESSIONS.pop(session_id, None)
        else:
            GLOBAL_SESSIONS[session_id] = session

        tts_output_filename = f"outputs/{session_id}_{uuid.uuid4()}.mp3"
        tts.text_to_speech(full_text, tts_output_filename)

        yield json.dumps({
            "type": "done",
            "audio_url": f"/api/audio/{os.path.basename(tts_output_filename)}",
            "completed": is_completed,
        }) + "\n"

    return StreamingResponse(generate(), media_type="text/plain")

@app.get("/api/audio/{filename}")
async def get_audio(filename: str):
    file_path = f"outputs/{filename}"
    return FileResponse(file_path, media_type="audio/mpeg")

if __name__ == "__main__":
    import uvicorn
    rag.init_db()
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
