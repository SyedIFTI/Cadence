"""Settings shared by the whole backend."""
import os
from pathlib import Path

from dotenv import load_dotenv

BACKEND_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BACKEND_DIR / ".env")

GROQ_API_KEY = os.getenv("GROQ_API_KEY", "").strip()
WHISPER_MODEL = os.getenv("WHISPER_MODEL", "whisper-large-v3").strip()

DATA_DIR = Path(os.getenv("DATA_DIR", BACKEND_DIR / "data"))
AUDIO_DIR = DATA_DIR / "audio"
DB_PATH = DATA_DIR / "history.db"
AUDIO_DIR.mkdir(parents=True, exist_ok=True)

MAX_UPLOAD_BYTES = 50 * 1024 * 1024
MAX_SECONDS = 10 * 60
MIN_WORDS = 10
