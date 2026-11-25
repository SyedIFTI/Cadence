import wave

import pytest
from fastapi.testclient import TestClient

from app import main, sample, scoring, transcriber
from app.analysis import fillers, pace, pauses, text, vocabulary
from app.pipeline import build_report


@pytest.fixture
def client():
    with TestClient(main.app) as c:
        yield c


def labels(sentence):
    return [f["label"] for f in fillers.analyze(text.nlp()(sentence), [])["found"]]


@pytest.mark.parametrize("sentence, expected", [
    ("I like music and I like tea.", []),
    ("It was, like, huge.", ["like"]),
    ("We use languages like Python.", []),
    ("Um, I think, uh, it works.", ["um", "uh"]),
    ("It is expensive, you know, for students.", ["you know"]),
    ("Do you know the answer?", []),
    ("This kind of food is healthy.", []),
    ("It was kind of strange.", ["kind of"]),
])
def test_fillers_use_context(sentence, expected):
    assert labels(sentence) == expected


def test_alignment_keeps_every_word():
    t = sample.transcript()
    assert len(text.align_words(t["text"], t["words"])) == len(t["words"])


def test_pauses_and_pace():
    words = [{"start": 0, "end": 1}, {"start": 1.2, "end": 2}, {"start": 4.5, "end": 5}]
    p = pauses.analyze(words, 5)
    assert (p["count"], p["long"], p["longest"]) == (1, 1, 2.5)
    steady = [{"start": i * 0.5, "end": i * 0.5 + 0.4} for i in range(120)]
    result = pace.analyze(steady, 60, 0)
    assert result["wpm"] == 120
    assert sum(w["wpm"] * (w["end"] - w["start"]) / 60 for w in result["timeline"]) == pytest.approx(120)


def test_mattr():
    assert vocabulary.moving_average_ttr(["a"] * 100) == pytest.approx(0.02)
    assert vocabulary.moving_average_ttr(["a", "b"]) == 1


def test_interpolate():
    points = [(0, 100), (10, 0)]
    assert [scoring.interpolate(x, points) for x in (-1, 5, 20)] == [100, 50, 0]
    assert sum(scoring.WEIGHTS.values()) == 100


def test_sample_report():
    report = build_report(sample.transcript())
    assert all(0 <= v <= 100 for v in report["score"]["parts"].values())
    assert report["extras"]["repeats"][0]["word"] == "our"
    found = {c["label"]: c["count"] for c in report["fillers"]["counts"]}
    assert found["um"] == 2 and found["like"] == 1


def test_history_roundtrip(client):
    report_id = client.post("/api/analyze/sample").json()["id"]
    assert client.get(f"/api/reports/{report_id}").json()["source"] == "sample"
    assert report_id in [r["id"] for r in client.get("/api/reports").json()]
    assert client.delete(f"/api/reports/{report_id}").status_code == 204
    assert client.get(f"/api/reports/{report_id}").status_code == 404


def test_upload_runs_ffmpeg(client, tmp_path, monkeypatch):
    path = tmp_path / "tone.wav"
    with wave.open(str(path), "wb") as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(44100)
        w.writeframes(b"\0" * 44100 * 4)
    monkeypatch.setattr(transcriber, "transcribe", lambda p: sample.transcript())
    with open(path, "rb") as f:
        response = client.post("/api/analyze", files={"file": f}, data={"title": "Test"})
    assert response.status_code == 200
    audio = client.get(f"/api/reports/{response.json()['id']}/audio")
    assert audio.content[:4] == b"fLaC"


def test_bad_file_is_rejected(client):
    assert client.post("/api/analyze", files={"file": ("a.mp3", b"not audio")}).status_code == 400


def test_missing_key(client, tmp_path, monkeypatch):
    monkeypatch.setattr(transcriber.config, "GROQ_API_KEY", "")
    with pytest.raises(transcriber.TranscriptionError):
        transcriber.transcribe(tmp_path / "x.flac")
