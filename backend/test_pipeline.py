import time
import uuid

print("Testing Pipeline...")

t0 = time.time()
print("1. Loading ASR...")
import asr
print(f"ASR Loaded in {time.time()-t0:.2f}s")

t1 = time.time()
print("2. Transcribing...")
res = asr.transcribe_audio("test.aiff")
print(f"Transcription: {res}")
print(f"Transcribed in {time.time()-t1:.2f}s")

t2 = time.time()
print("3. Loading LLM & Ollama...")
import llm
print(f"LLM Loaded in {time.time()-t2:.2f}s")

t3 = time.time()
print("4. Evaluating answer...")
ans = llm.evaluate_answer("What is python?", res)
print(f"Evaluation: {ans}")
print(f"Evaluated in {time.time()-t3:.2f}s")

t4 = time.time()
print("5. TTS...")
import tts
tts.text_to_speech(ans['evaluation_and_followup'], "test_out.aiff")
print(f"TTS completed in {time.time()-t4:.2f}s")

print(f"Total time: {time.time()-t0:.2f}s")
