import json
import os
import time
from groq import Groq
from dotenv import load_dotenv

# Ensure GROQ_API_KEY is available
load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))
client = Groq()

JSON_PATH = "starter_questions.json"

def load_questions():
    if os.path.exists(JSON_PATH):
        with open(JSON_PATH, "r", encoding="utf-8") as f:
            return json.load(f)
    return []

def save_questions(questions):
    with open(JSON_PATH, "w", encoding="utf-8") as f:
        json.dump(questions, f, indent=2, ensure_ascii=False)

def generate_batch(job_role, topic, q_type, count=20):
    sys_prompt = (
        "You are an expert technical interviewer and data generator. "
        "Your task is to generate high-quality, realistic interview questions for tech companies. "
        "Respond ONLY with a valid JSON array of objects. Do not include markdown code blocks, just the raw JSON array. "
        "Each object must have the following keys: "
        "'job_role' (must be exactly one of: 'any', 'software engineering', 'machine learning', 'data science', 'data analyst'), "
        "'topic' (e.g., 'SDE', 'MLE', 'Behavioral', 'System Design', 'Statistics'), "
        "'difficulty' (must be 'easy', 'medium', or 'hard'), "
        "'question' (the text of the question), "
        "'type' (must be 'behavioral' or 'technical')."
    )
    
    prompt = (
        f"Generate {count} unique interview questions for the job_role '{job_role}'. "
        f"The topic should be '{topic}' and the type should be '{q_type}'. "
        f"Vary the difficulty between easy, medium, and hard. "
        f"Make sure the questions are distinct from standard generic questions. "
        f"Return ONLY a valid JSON array."
    )
    
    try:
        response = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[
                {"role": "system", "content": sys_prompt},
                {"role": "user", "content": prompt}
            ],
            temperature=0.8,
            max_tokens=4000,
        )
        content = response.choices[0].message.content.strip()
        
        # Clean up markdown if model ignored instructions
        if content.startswith("```json"):
            content = content[7:]
        if content.startswith("```"):
            content = content[3:]
        if content.endswith("```"):
            content = content[:-3]
            
        return json.loads(content.strip())
    except Exception as e:
        print(f"Error generating batch for {job_role}: {e}")
        return []

def main():
    questions = load_questions()
    existing_ids = {q["id"] for q in questions}
    next_id = max(existing_ids) + 1 if existing_ids else 1
    
    print(f"Initial question count: {len(questions)}")
    
    # We want to reach ~1000 questions. We need ~850 more.
    # 850 / 50 = 17 batches. Let's define the batches we want.
    targets = [
        ("software engineering", "System Design", "technical", 30),
        ("software engineering", "Algorithms & Data Structures", "technical", 40),
        ("software engineering", "Backend & Databases", "technical", 30),
        ("machine learning", "Deep Learning & PyTorch", "technical", 30),
        ("machine learning", "ML System Design", "technical", 30),
        ("machine learning", "NLP & LLMs", "technical", 30),
        ("data science", "Statistics & Probability", "technical", 30),
        ("data science", "Machine Learning Algorithms", "technical", 30),
        ("data science", "A/B Testing & Experimentation", "technical", 30),
        ("data analyst", "Advanced SQL", "technical", 40),
        ("data analyst", "Product Sense & Metrics", "technical", 30),
        ("data analyst", "Data Visualization & Tableau", "technical", 20),
        ("any", "Behavioral - Leadership", "behavioral", 20),
        ("any", "Behavioral - Conflict Resolution", "behavioral", 20),
        ("any", "Behavioral - Failure & Growth", "behavioral", 20),
    ]
    
    total_added = 0
    import random
    
    while len(questions) < 1000:
        role, topic, q_type, count = random.choice(targets)
        print(f"Generating {count} questions for {role} - {topic}...")
        
        # Break into chunks of 20 to avoid max_tokens limits
        chunks = [20] * (count // 20) + ([count % 20] if count % 20 != 0 else [])
        
        for chunk in chunks:
            new_qs = generate_batch(role, topic, q_type, chunk)
            for q in new_qs:
                q["id"] = next_id
                next_id += 1
                questions.append(q)
                total_added += 1
            print(f"  Added {len(new_qs)} questions. Total: {len(questions)}")
            save_questions(questions)
            time.sleep(1) # rate limit protection
            
            if len(questions) >= 1000:
                print("Reached 1000 questions!")
                break
            
    print(f"Final question count: {len(questions)}")
    print("Done generating.")

if __name__ == "__main__":
    main()
