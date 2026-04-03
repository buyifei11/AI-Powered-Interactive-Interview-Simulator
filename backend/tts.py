import os
import subprocess

FFMPEG_PATH = "/opt/homebrew/bin/ffmpeg"

def text_to_speech(text: str, output_path: str = "output.mp3"):
    """
    Converts text to speech using macOS 'say', then converts to mp3.
    """
    try:
        # Step 1: Use macOS say to generate aiff
        aiff_path = output_path.replace(".mp3", ".aiff")
        subprocess.run(
            ["say", "-v", "Samantha", "-o", aiff_path, text],
            check=True,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL
        )
        # Step 2: Convert aiff -> mp3 for browser compatibility
        subprocess.run(
            [FFMPEG_PATH, "-y", "-i", aiff_path, "-codec:a", "libmp3lame", "-b:a", "128k", output_path],
            check=True,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL
        )
        # Clean up temp aiff
        if os.path.exists(aiff_path):
            os.remove(aiff_path)
        return output_path
    except Exception as e:
        print(f"TTS Error: {e}")
        return None

if __name__ == "__main__":
    out = text_to_speech("Hello, I am ready to conduct the interview.", "test_speech.mp3")
    if out:
        print(f"TTS test completed: {out}")
