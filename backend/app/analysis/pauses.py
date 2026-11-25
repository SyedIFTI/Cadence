"""Pauses: gaps between the end of one word and the start of the next."""
MIN_PAUSE, LONG_PAUSE = 0.5, 2.0


def analyze(words: list[dict], duration: float) -> dict:
    pauses = []
    for index in range(1, len(words)):
        gap = words[index]["start"] - words[index - 1]["end"]
        if gap >= MIN_PAUSE:
            kind = "long" if gap >= LONG_PAUSE else "medium" if gap >= 1 else "short"
            pauses.append({"start": round(words[index - 1]["end"], 2), "seconds": round(gap, 2),
                           "kind": kind, "before_word": index})
    total = sum(p["seconds"] for p in pauses)
    return {
        "count": len(pauses),
        "short": sum(p["kind"] == "short" for p in pauses),
        "medium": sum(p["kind"] == "medium" for p in pauses),
        "long": sum(p["kind"] == "long" for p in pauses),
        "total_seconds": round(total, 1),
        "longest": max((p["seconds"] for p in pauses), default=0),
        "silence_percent": round(100 * total / max(duration, 1), 1),
        "found": pauses,
    }
