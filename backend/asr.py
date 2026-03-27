import os
from faster_whisper import WhisperModel

# Use a small model for local fast transcription.
# On Mac with Apple Silicon, we can use cpu or auto. compute_type="int8" is safer.
MODEL_SIZE = "tiny.en" 

# Initialize model
print(f"Loading faster-whisper model: {MODEL_SIZE}...")
try:
    model = WhisperModel(MODEL_SIZE, device="cpu", compute_type="int8")
    print("ASR Model loaded.")
except Exception as e:
    print(f"Error loading ASR model: {e}")
    model = None

def transcribe_audio(audio_path: str) -> str:
    """
    Transcribes the given audio file and returns the text.
    """
    if not model:
        return "ASR Model is not loaded properly."
        
    try:
        segments, info = model.transcribe(audio_path, beam_size=5)
        text = ""
        for segment in segments:
            text += segment.text + " "
        return text.strip()
    except Exception as e:
        print(f"Transcription error: {e}")
        return f"Error transcribing audio: {e}"

if __name__ == "__main__":
    print("ASR Module initialized.")
