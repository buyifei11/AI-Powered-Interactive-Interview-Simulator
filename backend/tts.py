import os
from typing import Optional
from openai import OpenAI

VOICE = "nova"  # alloy | echo | fable | onyx | nova | shimmer

def text_to_speech(text: str, output_path: str = "output.mp3") -> Optional[str]:
    api_key = os.environ.get("OPENAI_API_KEY")
    if not api_key:
        print("Warning: OPENAI_API_KEY not found, TTS skipped.")
        return None
    try:
        client = OpenAI(api_key=api_key)
        response = client.audio.speech.create(
            model="tts-1",
            voice=VOICE,
            input=text,
        )
        response.stream_to_file(output_path)
        return output_path
    except Exception as e:
        print(f"TTS Error: {e}")
        return None

if __name__ == "__main__":
    out = text_to_speech("Hello, I am ready to conduct the interview.", "test_speech.mp3")
    if out:
        print(f"TTS test completed: {out}")
