import ollama

# Default model (user should have this pulled in Ollama, e.g., 'llama3' or 'qwen2')
DEFAULT_MODEL = "llama3"

def generate_response(prompt: str, system_prompt: str = "", model: str = DEFAULT_MODEL) -> str:
    """
    Generates a response from the local Ollama model.
    """
    try:
        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        messages.append({"role": "user", "content": prompt})
        
        response = ollama.chat(model=model, messages=messages)
        return response['message']['content']
    except Exception as e:
        print(f"Error communicating with Ollama: {e}")
        return f"Error connecting to Ollama: {e}"

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
    # Test
    # Make sure Ollama is running and has llama3 installed: `ollama run llama3`
    print("Testing Ollama connection...")
    res = generate_response("Hello, what is 2+2?", "You are a helpful assistant.", DEFAULT_MODEL)
    print("Response:", res)
