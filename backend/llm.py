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

def generate_response(prompt: str, system_prompt: str = "", model: str = DEFAULT_MODEL, image_base64: str = None) -> str:
    """
    Generates a response from Groq API (or OpenAI if image is provided).
    """
    if image_base64:
        # Route to OpenAI API for Vision support
        openai_api_key = os.environ.get("OPENAI_API_KEY")
        if not openai_api_key:
            return "Error: OPENAI_API_KEY is missing. Cannot process image."
        try:
            client = OpenAI(api_key=openai_api_key)
            messages = []
            if system_prompt:
                messages.append({"role": "system", "content": system_prompt})
            
            messages.append({
                "role": "user",
                "content": [
                    {"type": "text", "text": prompt},
                    {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{image_base64}"}}
                ]
            })
            
            response = client.chat.completions.create(
                model='gpt-4o-mini',
                messages=messages,
                max_tokens=512,
                temperature=0.7,
            )
            return response.choices[0].message.content
        except Exception as e:
            print(f"Error communicating with OpenAI API: {e}")
            print("Falling back to standard Groq text-only evaluation!")
            # Gracefully fail over to Groq without crashing the conversation
            image_base64 = None

    # Text-only requests still go to Groq for speed
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

def evaluate_answer(question: str, user_answer: str, context: str = "", image_base64: str = None, candidate_name: str = "") -> dict:
    """
    Evaluates the user's answer and generates a follow-up question.
    """
    name_ref = f" {candidate_name}" if candidate_name else ""
    sys_prompt = (
        "You are a sharp but warm technical interviewer having a real conversation — "
        "think of yourself as a thoughtful senior engineer, not a grading rubric. "
        "React naturally to what the candidate just said: acknowledge something specific they did well, "
        "gently probe any gap or vague point, and show genuine curiosity. "
        "Keep the tone conversational and encouraging. "
        f"Address the candidate as '{candidate_name}' once if it feels natural{', otherwise skip the name' if candidate_name else ''}. "
        "Finish with exactly one concise follow-up question."
    )

    prompt = f"Question asked: {question}\n\nCandidate's answer: {user_answer}"
    if context:
        prompt += f"\n\nAdditional context: {context}"
    prompt += f"\n\nReact naturally to {candidate_name + chr(39) + 's' if candidate_name else 'the'} answer and ask one follow-up question."

    response_text = generate_response(prompt, system_prompt=sys_prompt, image_base64=None)

    return {
        "evaluation_and_followup": response_text
    }

def generate_final_score(history_summary: str, candidate_name: str = "") -> str:
    """
    Generates a wrap-up with score and hiring decision.
    """
    name_line = f"The candidate's name is {candidate_name}. " if candidate_name else ""
    sys_prompt = (
        "You are the hiring manager wrapping up an interview. "
        f"{name_line}"
        "Speak directly to the candidate in a warm, honest tone — as if giving feedback face to face. "
        "Highlight two or three genuine strengths you noticed throughout the conversation, "
        "then mention one concrete area to work on. "
        "End with an overall score out of 100 and a clear hiring decision: Hired or Not Hired. "
        "Keep it personal, specific, and encouraging regardless of the outcome."
    )
    prompt = (
        f"Here is the full interview transcript:\n{history_summary}\n\n"
        "Please give your closing feedback, score, and decision."
    )

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
