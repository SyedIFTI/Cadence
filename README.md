# Cadence – Speech Analysis with NLP

Record or upload a speech and get a report on filler words, pace, pauses, vocabulary, sentence complexity and clarity.

```
Audio (mic/upload) → ffmpeg (16 kHz mono) → Whisper on Groq (word timestamps)
    → Analysis modules → Scoring (0–100) → Report UI + SQLite history
```

## Run it

You need Python 3.10–3.12 and Node 20.19 or newer. ffmpeg comes with the Python packages.

**1. Backend**

```bash
cd backend
python3 -m venv venv
source venv/bin/activate          # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env              # then paste your key from https://console.groq.com/keys
uvicorn app.main:app --port 8000
```

**2. Frontend** (second terminal)

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173. **Try a sample speech** works without a key. API docs are at http://localhost:8000/docs.

Tests: `cd backend && venv/bin/python -m pytest`

## Where things are

| File in `backend/app` | Job |
|---|---|
| `main.py` | API routes, and the full flow in `analyze()` |
| `audio.py` | ffmpeg conversion |
| `transcriber.py` | Groq Whisper call |
| `pipeline.py` | Runs all modules and builds the report |
| `analysis/` | One file per NLP measurement |
| `scoring.py` | Scores, weights and tips |
| `database.py` | SQLite history |

The frontend has three pages in `frontend/src/pages`: Home, Report and History.

## The NLP

| Measure | Technique |
|---|---|
| Fillers | Word list + POS tags + neighbouring words ("I like tea" vs "it was, like, huge") |
| Pace | Words per minute, overall and in time windows |
| Pauses | Gaps of 0.5 s or more between Whisper word timestamps |
| Vocabulary | Lemmatization, type-token ratio, MATTR, lexical density, POS distribution, keywords |
| Complexity | Dependency tree depth, subordinate clauses, sentence length, Flesch scores |
| Extras | Hedging phrases, repeated words, passive voice |

**Overall score** = fillers 25% + pace 20% + clarity 20% + vocabulary 15% + sentences 10% + pauses 10%

**Clarity** = reading ease 40% + few hedges 20% + few repeats 20% + few fillers 20%

Each measurement becomes 0–100 by straight-line interpolation between points listed in `scoring.py`.

## Questions you may be asked

- **Why MATTR and not plain type-token ratio?** Plain TTR falls as a text gets longer. MATTR uses a fixed 50-word window.
- **How do spaCy results get a time?** `align_words()` finds each Whisper word's character position, which links it to spaCy's tokens.
- **Why 16 kHz mono?** It is the format Whisper was trained on.

## Limits

- English only, up to 10 minutes (longer audio is cut).
- Whisper often leaves out "um" and "uh". A prompt encourages it to keep them, but some are still missed.
- Word times are estimates, so very short pauses may be missed.
- The scoring points were hand-picked, not learned from human ratings.
- Audio is sent to Groq for transcription. A converted copy is kept in `backend/data` until you delete the report.
