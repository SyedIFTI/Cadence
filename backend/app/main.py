"""FastAPI routes. The flow of /api/analyze is the whole project in one function."""
import tempfile
import uuid
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse

from . import audio, config, database, pipeline, sample, transcriber
from .analysis import text


@asynccontextmanager
async def lifespan(_: FastAPI):
    database.init()
    text.nlp()  # load spaCy at startup so the first request is fast
    yield


app = FastAPI(title="Cadence - Speech Analysis API", lifespan=lifespan)
app.add_middleware(CORSMiddleware, allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
                   allow_methods=["*"], allow_headers=["*"])


@app.get("/api/health")
def health():
    return {"ok": True, "groq_key": bool(config.GROQ_API_KEY), "model": config.WHISPER_MODEL}


@app.post("/api/analyze")
def analyze(file: UploadFile = File(...), title: str = Form(""), source: str = Form("upload")):
    report_id = uuid.uuid4().hex
    target = config.AUDIO_DIR / f"{report_id}.flac"
    try:
        with tempfile.TemporaryDirectory() as folder:
            original = Path(folder) / "input"
            save_upload(file, original)
            audio.convert_to_16k_mono(original, target, config.MAX_SECONDS)   # 1. ffmpeg
        transcript = transcriber.transcribe(target)                           # 2. Whisper
        report = pipeline.build_report(transcript)                            # 3. NLP + scoring
        name = title.strip()[:100] or "Untitled speech"
        database.save(report_id, name, "mic" if source == "mic" else "upload", report)  # 4. SQLite
    except audio.AudioError as error:
        target.unlink(missing_ok=True)
        raise HTTPException(400, str(error))
    except pipeline.TooShortError as error:
        target.unlink(missing_ok=True)
        raise HTTPException(422, str(error))
    except transcriber.TranscriptionError as error:
        target.unlink(missing_ok=True)
        raise HTTPException(error.status, str(error))
    except Exception:
        target.unlink(missing_ok=True)
        raise
    return {"id": report_id}


@app.post("/api/analyze/sample")
def analyze_sample():
    report_id = uuid.uuid4().hex
    report = pipeline.build_report(sample.transcript())
    database.save(report_id, "Sample: Solar power for our school", "sample", report)
    return {"id": report_id}


@app.get("/api/reports")
def list_reports():
    return database.list_all()


@app.get("/api/reports/{report_id}")
def get_report(report_id: str):
    found = database.get(report_id)
    if found is None:
        raise HTTPException(404, "Report not found.")
    found["has_audio"] = audio_path(found["id"]).exists()
    return found


@app.get("/api/reports/{report_id}/audio")
def get_audio(report_id: str):
    if database.get(report_id) is None or not audio_path(report_id).exists():
        raise HTTPException(404, "Audio not found.")
    return FileResponse(audio_path(report_id), media_type="audio/flac")


@app.delete("/api/reports/{report_id}", status_code=204)
def delete_report(report_id: str):
    if not database.delete(report_id):
        raise HTTPException(404, "Report not found.")
    audio_path(report_id).unlink(missing_ok=True)


def audio_path(report_id: str) -> Path:
    return config.AUDIO_DIR / f"{report_id}.flac"


def save_upload(file: UploadFile, target: Path) -> None:
    size = 0
    with open(target, "wb") as out:
        while chunk := file.file.read(1024 * 1024):
            size += len(chunk)
            if size > config.MAX_UPLOAD_BYTES:
                raise HTTPException(413, "The file is larger than 50 MB.")
            out.write(chunk)
    if size == 0:
        raise HTTPException(400, "The file is empty.")
