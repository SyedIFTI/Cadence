"""Step 2: speech to text with Groq's hosted Whisper model."""
from pathlib import Path

import groq

from . import config

# Whisper tends to "clean up" speech by dropping hesitations. A prompt written
# in a disfluent style encourages it to keep them in the transcript.
PROMPT = "Um, so, uh, like, you know, I was, er, I mean, hmm, kind of thinking about it."


class TranscriptionError(Exception):
    def __init__(self, message: str, status: int = 502):
        super().__init__(message)
        self.status = status


def transcribe(path: Path) -> dict:
    """Return {"text", "duration", "words": [{"word", "start", "end"}]}."""
    if not config.GROQ_API_KEY:
        raise TranscriptionError(
            "No Groq API key found. Add GROQ_API_KEY to backend/.env and restart the backend.", 503)

    client = groq.Groq(api_key=config.GROQ_API_KEY, timeout=120)
    try:
        with open(path, "rb") as audio:
            response = client.audio.transcriptions.create(
                file=(path.name, audio),
                model=config.WHISPER_MODEL,
                language="en",
                prompt=PROMPT,
                temperature=0,
                response_format="verbose_json",
                timestamp_granularities=["word", "segment"],
            )
    except groq.AuthenticationError:
        raise TranscriptionError("Groq rejected the API key. Check GROQ_API_KEY in backend/.env.")
    except groq.RateLimitError:
        raise TranscriptionError("Groq's rate limit was reached. Wait a minute and try again.", 429)
    except groq.APIConnectionError:
        raise TranscriptionError("Could not reach Groq. Check your internet connection.")
    except groq.APIStatusError as error:
        raise TranscriptionError(f"Groq could not transcribe this audio (status {error.status_code}).")

    data = response.model_dump()
    words = [
        {"word": w["word"].strip(), "start": float(w["start"]), "end": float(w["end"])}
        for w in (data.get("words") or []) if w["word"].strip()
    ]
    duration = float(data.get("duration") or (words[-1]["end"] if words else 0))
    return {"text": (data.get("text") or "").strip(), "duration": duration, "words": words}
