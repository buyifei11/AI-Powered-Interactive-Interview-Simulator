import os
from groq import Groq

DEFAULT_MODEL = "llama-3.1-8b-instant"

def get_client():
    api_key = os.environ.get("GROQ_API_KEY")
    if not api_key:
        print("Warning: GROQ_API_KEY not found in environment.")
        return None
    return Groq(api_key=api_key)

def generate_response(prompt: str, system_prompt: str = "", model: str = DEFAULT_MODEL) -> str:
    """
    Generates a response from Groq API.
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

def evaluate_answer(question: str, user_answer: str, context: str = "") -> dict:
    """
    Evaluates the user's answer and generates a follow-up.
    """
    sys_prompt = "You are an expert technical interviewer. Evaluate the candidate's answer based on relevance, structure, and clarity. Then, ask ONE short follow-up question."
    
    prompt = f"Question: {question}\n\nCandidate Answer: {user_answer}"
    if context:
        prompt += f"\n\nContext/Topic info: {context}"
        
    prompt += "\n\nPlease provide a short evaluation and exactly one follow-up question."
    
    response_text = generate_response(prompt, system_prompt=sys_prompt)
    
    return {
        "evaluation_and_followup": response_text
    }

if __name__ == "__main__":
    print("Testing Groq API connection...")
    res = generate_response("Hello, what is 2+2?", "You are a helpful assistant.", DEFAULT_MODEL)
    print("Response:", res)
