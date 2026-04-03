import os
import subprocess
from typing import Optional
from groq import Groq

FFMPEG_PATH = "/opt/homebrew/bin/ffmpeg"

def get_client():
    api_key = os.environ.get("GROQ_API_KEY")
    if not api_key:
        print("Warning: GROQ_API_KEY not found in environment.")
        return None
    return Groq(api_key=api_key)

def convert_to_mp3(audio_path: str) -> Optional[str]:
    """
    Converts any audio file to mp3 using ffmpeg so Groq can process it.
    Returns the path to the converted mp3 file, or None on failure.
    """
    mp3_path = os.path.splitext(audio_path)[0] + ".mp3"
    try:
        result = subprocess.run(
            [FFMPEG_PATH, "-y", "-i", audio_path, "-vn", "-ar", "16000", "-ac", "1", "-b:a", "64k", mp3_path],
            check=True,
            capture_output=True,
            text=True
        )
        return mp3_path
    except subprocess.CalledProcessError as e:
        print(f"ffmpeg conversion error (stderr): {e.stderr}")
        return None

def transcribe_audio(audio_path: str) -> str:
    """
    Transcribes the given audio file using Groq's Whisper API and returns the text.
    Automatically converts the audio to mp3 first to ensure compatibility.
    """
    client = get_client()
    if not client:
        return "Error: GROQ_API_KEY is missing."

    # Check if file exists and is non-empty
    if not os.path.exists(audio_path) or os.path.getsize(audio_path) == 0:
        print(f"Audio file is missing or empty: {audio_path}")
        return "Error: Audio file was empty. Please try recording again."

    print(f"Audio file size: {os.path.getsize(audio_path)} bytes")

    # Convert to mp3 first (browsers send webm which Groq doesn't accept natively)
    mp3_path = convert_to_mp3(audio_path)
    if not mp3_path:
        return "Error: Failed to convert audio. Please try again."

    try:
        with open(mp3_path, "rb") as audio_file:
            transcription = client.audio.transcriptions.create(
                file=(os.path.basename(mp3_path), audio_file),
                model="whisper-large-v3",
                response_format="json"
            )
        return transcription.text.strip()
    except Exception as e:
        print(f"Transcription error: {e}")
        return f"Error transcribing audio via Groq: {e}"
    finally:
        # Clean up the converted mp3
        if mp3_path and mp3_path != audio_path and os.path.exists(mp3_path):
            os.remove(mp3_path)

if __name__ == "__main__":
    print("Groq ASR Module initialized.")
