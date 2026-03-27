import os
import subprocess

# Simple TTS wrapper using macOS built-in `say` command.
# This avoids complex Piper/Coqui installations during the prototyping phase.
# The resulting audio format is AIFF.

def text_to_speech(text: str, output_path: str = "output.aiff"):
    """
    Converts text to speech using macOS 'say'.
    Returns the path to the generated audio file.
    """
    try:
        # Using a reliable built-in voice, e.g., 'Samantha'
        subprocess.run(
            ["say", "-v", "Samantha", "-o", output_path, text], 
            check=True,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL
        )
        return output_path
    except Exception as e:
        print(f"TTS Error (ensure you are on macOS): {e}")
        return None

if __name__ == "__main__":
    out = text_to_speech("Hello, I am ready to conduct the interview.", "test_speech.aiff")
    if out:
        print(f"TTS test completed: {out}")
        # Optional: play it to test
        # os.system(f"afplay {out}")
