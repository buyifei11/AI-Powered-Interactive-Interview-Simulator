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

def evaluate_answer(question: str, user_answer: str, context: str = "", image_base64: str = None) -> dict:
    """
    Evaluates the user's answer and generates a follow-up.
    """
    sys_prompt = "You are an expert technical interviewer. Evaluate the candidate's answer based on relevance, structure, and clarity. Then, ask ONE short follow-up question."
    
    prompt = f"Question: {question}\n\nCandidate Answer: {user_answer}"
    if context:
        prompt += f"\n\nContext/Topic info: {context}"
        
    prompt += "\n\nPlease provide a short evaluation and exactly one follow-up question."
    
    # Reverted to text-only evaluation to maintain the standard grading format without refusal mess
    response_text = generate_response(prompt, system_prompt=sys_prompt, image_base64=None)
    
    return {
        "evaluation_and_followup": response_text
    }

def generate_final_score(history_summary: str) -> str:
    """
    Generates a conclusive remark based on the interview performance.
    """
    sys_prompt = "You are the hiring manager concluding the interview round. Provide a brief summary of the candidate's performance, a final score out of 100, and a final decision: whether they are 'Hired' or 'Not Hired'."
    prompt = f"Here is the summary of the candidate's answers and behaviors:\n{history_summary}\nPlease generate your final score and decision."
    
    return generate_response(prompt, system_prompt=sys_prompt)

if __name__ == "__main__":
    print("Testing Groq API connection...")
    res = generate_response("Hello, what is 2+2?", "You are a helpful assistant.", DEFAULT_MODEL)
    print("Response:", res)
