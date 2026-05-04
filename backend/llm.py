import os
from groq import Groq
from openai import OpenAI

DEFAULT_MODEL = "llama-3.1-8b-instant"

def get_client():
    api_key = os.environ.get("GROQ_API_KEY")
    if not api_key:
        print("Warning: GROQ_API_KEY not found in environment.")
        return None
    return Groq(api_key=api_key)

def analyze_facial_expression(image_base64: str) -> str:
    """
    Calls OpenAI GPT-4o-mini to analyze facial expression and body language from a single frame.
    Returns a short 1-2 sentence description of the candidate's emotion/confidence.
    """
    openai_api_key = os.environ.get("OPENAI_API_KEY")
    if not openai_api_key:
        return "No OpenAI key provided, skipping facial analysis."

    try:
        client = OpenAI(api_key=openai_api_key)
        sys_prompt = "You are an expert at reading micro-expressions and body language."
        prompt = (
            "Analyze the facial expression, eye contact, and posture of the person in this image. "
            "Are they smiling, nervous, confused, confident, or distracted? "
            "Return ONLY a short, punchy 1-2 sentence observation about their expression. "
            "Do NOT include any prefixes like 'The candidate appears'—just state the observation."
        )

        response = client.chat.completions.create(
            model='gpt-4o-mini',
            messages=[
                {"role": "system", "content": sys_prompt},
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": prompt},
                        {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{image_base64}"}}
                    ]
                }
            ],
            max_tokens=50,
            temperature=0.3,
        )
        return response.choices[0].message.content.strip()
    except Exception as e:
        print(f"Error in facial analysis: {e}")
        return ""

def generate_response(prompt: str, system_prompt: str = "", model: str = DEFAULT_MODEL) -> str:
    """
    Generates a response from Groq API (text-only).
    """
    client = get_client()
    if not client:
        return "Error: GROQ_API_KEY is missing."

    try:
        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
            
        messages.append({"role": "user", "content": prompt})
        
        chat_completion = client.chat.completions.create(
            messages=messages,
            model=model,
            temperature=0.7,
            max_tokens=512,
        )
        return chat_completion.choices[0].message.content
    except Exception as e:
        print(f"Error communicating with Groq API: {e}")
        return f"Error connecting to Groq API: {e}"

def evaluate_answer(question: str, user_answer: str, context: str = "", candidate_name: str = "") -> dict:
    """
    Evaluates the user's answer using CoT (Logic, Tech Depth, Communication) and generates a strategic follow-up.
    When image_base64 is provided, it can also observe the candidate's webcam frame.
    """
    name_clause = f"Address the candidate as '{candidate_name}' once if it feels natural. " if candidate_name else ""

    if image_base64:
        sys_prompt = (
            "You are an expert technical interviewer at a top-tier tech company. "
            "This session is conducted with the candidate's explicit consent to webcam-based coaching. "
            "You are given a screenshot captured from their webcam during their answer.\n\n"
            "Your goal is to evaluate the candidate's answer and push them further with a strategic follow-up.\n\n"
            
            "### Evaluation Dimensions:\n"
            "1. **Logic (逻辑性)**: Is the answer structured? Does it follow a clear sequence (e.g., STAR method)?\n"
            "2. **Technical Depth (技术深度)**: Does the candidate understand the 'why' behind the 'how'? Are they aware of trade-offs and edge cases?\n"
            "3. **Communication (沟通力)**: Is the explanation clear and concise? Is the tone professional?\n\n"
            "If the webcam frame clearly shows something coaching-relevant — eye contact with the camera, confident posture, or relaxed expression — add exactly one short sentence of non-verbal feedback (skip this entirely if the frame is unclear or nothing notable is visible) into the Communication score.\n\n"
            
            "### Follow-up Strategy:\n"
            "- If the answer is vague: Ask for a specific example using the STAR method (Situation, Task, Action, Result).\n"
            "- If the answer is shallow: Ask about the underlying principles, bottlenecks, or alternative solutions.\n"
            "- If the answer is strong: Challenge them with a 'What if' scenario or a scale-related trade-off.\n\n"
            
            "### Output Format:\n"
            "**[Evaluation]**\n"
            "- **Logic**: [Brief comment + Score/10]\n"
            "- **Technical Depth**: [Brief comment + Score/10]\n"
            "- **Communication**: [Brief comment + Score/10]\n\n"
            "**[Follow-up Question]**\n"
            f"{name_clause}Your one strategic follow-up question here."
        )
    else:
        sys_prompt = (
            "You are an expert technical interviewer at a top-tier tech company. "
            "Your goal is to evaluate the candidate's answer and push them further with a strategic follow-up.\n\n"
            
            "### Evaluation Dimensions:\n"
            "1. **Logic (逻辑性)**: Is the answer structured? Does it follow a clear sequence (e.g., STAR method)?\n"
            "2. **Technical Depth (技术深度)**: Does the candidate understand the 'why' behind the 'how'? Are they aware of trade-offs and edge cases?\n"
            "3. **Communication (沟通力)**: Is the explanation clear and concise? Is the tone professional?\n\n"
            
            "### Follow-up Strategy:\n"
            "- If the answer is vague: Ask for a specific example using the STAR method (Situation, Task, Action, Result).\n"
            "- If the answer is shallow: Ask about the underlying principles, bottlenecks, or alternative solutions.\n"
            "- If the answer is strong: Challenge them with a 'What if' scenario or a scale-related trade-off.\n\n"
            
            "### Output Format:\n"
            "**[Evaluation]**\n"
            "- **Logic**: [Brief comment + Score/10]\n"
            "- **Technical Depth**: [Brief comment + Score/10]\n"
            "- **Communication**: [Brief comment + Score/10]\n\n"
            "**[Follow-up Question]**\n"
            f"{name_clause}Your one strategic follow-up question here."
        )
    
    # Few-shot example for the model to follow
    few_shot_context = (
        "\n\nExample:\n"
        "Question: How do you handle a slow database query?\n"
        "Candidate Answer: I would add an index to the table.\n"
        "Output:\n"
        "**[Evaluation]**\n"
        "- **Logic**: Direct but lacks process. 6/10\n"
        "- **Technical Depth**: Mentioned indexing, but didn't discuss analysis (EXPLAIN) or alternatives (caching). 5/10\n"
        "- **Communication**: Very concise, perhaps too brief for a senior role. 7/10\n\n"
        "**[Follow-up Question]**\n"
        "That's a good first step. Before adding an index, how would you identify exactly which part of the query is slow, and what are the potential downsides of over-indexing a table?"
    )

    prompt = f"Question: {question}\n\nCandidate Answer: {user_answer}"
    if context:
        prompt += f"\n\nContext/Topic info: {context}"
        
    prompt += "\n\nPlease provide the evaluation and follow-up question based on the format above."
    
    response_text = generate_response(prompt, system_prompt=sys_prompt + few_shot_context)
    
    return {
        "evaluation_and_followup": response_text
    }

def generate_final_score(history_summary: str, candidate_name: str = "") -> str:
    """
    Generates a conclusive remark based on the interview performance across all dimensions.
    """
    name_line = f"The candidate's name is {candidate_name}. " if candidate_name else ""
    sys_prompt = (
        "You are the Lead Hiring Manager. Review the entire interview history and provide a final verdict.\n"
        f"{name_line}"
        "Summarize their performance in: \n"
        "1. Logic & Problem Solving\n"
        "2. Technical Competency\n"
        "3. Communication & Cultural Fit\n\n"
        "Speak directly to the candidate in a warm, honest tone — as if giving feedback face to face. "
        "Highlight two or three genuine strengths you noticed throughout the conversation, "
        "then mention one concrete area to work on. "
        "End with a final score out of 100 and a 'Hired' or 'Not Hired' decision."
    )
    prompt = f"Interview History:\n{history_summary}\nPlease generate the final report."

    return generate_response(prompt, system_prompt=sys_prompt)

def stream_chat(prompt: str, system_prompt: str = "", model: str = DEFAULT_MODEL):
    """
    Yields raw Groq stream chunks for text-only requests.
    Caller iterates and reads chunk.choices[0].delta.content.
    """
    client = get_client()
    if not client:
        return
    messages = []
    if system_prompt:
        messages.append({"role": "system", "content": system_prompt})
    messages.append({"role": "user", "content": prompt})
    stream = client.chat.completions.create(
        messages=messages,
        model=model,
        temperature=0.7,
        max_tokens=512,
        stream=True,
    )
    yield from stream

if __name__ == "__main__":
    print("Testing Groq API connection...")
    res = generate_response("Hello, what is 2+2?", "You are a helpful assistant.", DEFAULT_MODEL)
    print("Response:", res)
