import json
import chromadb
from chromadb.utils import embedding_functions
import os

# Initialize ChromaDB in the data directory
DB_PATH = os.path.join(os.path.dirname(__file__), "data", "chroma_db")
chroma_client = chromadb.PersistentClient(path=DB_PATH)

# Use default HuggingFace MiniLM embedding function (will download automatically)
sentence_transformer_ef = embedding_functions.DefaultEmbeddingFunction()

def init_db(json_path=None):
    if json_path is None:
        json_path = os.path.join(os.path.dirname(__file__), "data", "starter_questions.json")
        
    # Get or create collection
    collection = chroma_client.get_or_create_collection(
        name="interview_questions",
        embedding_function=sentence_transformer_ef,
        metadata={"hnsw:space": "cosine"}
    )
    
    # Load JSON data
    try:
        with open(json_path, 'r', encoding='utf-8') as f:
            questions = json.load(f)
    except Exception as e:
        print(f"Error loading {json_path}: {e}")
        return collection
        
    ids = []
    documents = []
    metadatas = []
    
    for q in questions:
        q_id = str(q.get("id"))
        text = q.get("question")
        meta = {
            "job_role": q.get("job_role", ""),
            "topic": q.get("topic", ""),
            "difficulty": q.get("difficulty", ""),
            "type": q.get("type", "")
        }
        ids.append(q_id)
        documents.append(text)
        metadatas.append(meta)
        
    # Add to collection (upsert)
    if ids:
        collection.upsert(
            documents=documents,
            metadatas=metadatas,
            ids=ids
        )
    print(f"Loaded {len(questions)} questions into ChromaDB collection 'interview_questions'.")
    return collection

def get_retriever():
    return chroma_client.get_or_create_collection(
        name="interview_questions",
        embedding_function=sentence_transformer_ef
    )

def query_questions(query_text, n_results=2):
    collection = get_retriever()
    results = collection.query(
        query_texts=[query_text],
        n_results=n_results
    )
    return results

if __name__ == "__main__":
    init_db()
    # Test query
    print("Testing query: 'Tell me about python lists'")
    res = query_questions("Tell me about python lists", n_results=1)
    print(res)
