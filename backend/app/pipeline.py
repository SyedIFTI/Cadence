"""Step 3: run every analysis module on a transcript and build the report."""
from . import config, scoring
from .analysis import complexity, extras, fillers, pace, pauses, text, vocabulary


class TooShortError(Exception):
    pass


def build_report(transcript: dict) -> dict:
    words = text.align_words(transcript["text"], transcript["words"])
    if len(words) < config.MIN_WORDS:
        raise TooShortError(f"Only {len(words)} words were heard. Please speak for at least 15 seconds.")

    duration = max(transcript["duration"], words[-1]["end"])
    doc = text.nlp()(transcript["text"])

    report = {"duration": round(duration, 1), "text": transcript["text"]}
    report["fillers"] = fillers.analyze(doc, words)
    skip = {i for item in report["fillers"]["found"] for i in item["tokens"]}
    report["pauses"] = pauses.analyze(words, duration)
    report["pace"] = pace.analyze(words, duration, report["pauses"]["total_seconds"])
    report["vocabulary"] = vocabulary.analyze(doc, skip)
    report["complexity"] = complexity.analyze(doc, skip)
    report["extras"] = extras.analyze(doc, skip, words)
    report["score"] = scoring.analyze(report)
    report["tips"] = scoring.build_tips(report)
    report["words"] = tag_words(words, report)
    return report


def tag_words(words: list[dict], report: dict) -> list[dict]:
    """Mark each word as filler / repeat / after a pause for the transcript view."""
    tags = {}
    for item in report["extras"]["repeats"]:
        tags[item["index"]] = "repeat"
    for item in report["fillers"]["found"]:
        for index in item["words"]:
            tags[index] = "filler"
    gaps = {p["before_word"]: p["seconds"] for p in report["pauses"]["found"]}
    return [{"text": w["text"], "start": w["start"], "end": w["end"],
             "tag": tags.get(i), "pause": gaps.get(i)} for i, w in enumerate(words)]
