"""Speaking pace in words per minute (WPM), overall and over time."""
from statistics import pstdev

IDEAL_LOW, IDEAL_HIGH = 120, 160


def window_length(duration: float) -> float:
    """Short talks get shorter windows so the chart still has a shape."""
    return 10 if duration <= 90 else 15 if duration <= 180 else 30


def analyze(words: list[dict], duration: float, pause_seconds: float) -> dict:
    minutes = max(duration, 1) / 60
    speaking_minutes = max(duration - pause_seconds, 1) / 60

    size, timeline, start = window_length(duration), [], 0.0
    while start < duration:
        end = min(start + size, duration)
        if duration - end < size / 2:
            end = duration  # merge a tiny last window into this one
        # The last window is open ended so a word on the boundary still counts.
        is_last = end >= duration
        count = sum(1 for w in words if start <= w["start"] and (is_last or w["start"] < end))
        timeline.append({"start": round(start, 1), "end": round(end, 1),
                         "wpm": round(count / max(end - start, 1) * 60)})
        start = end

    return {
        "word_count": len(words),
        "wpm": round(len(words) / minutes),
        "articulation_wpm": round(len(words) / speaking_minutes),
        "variation": round(pstdev([p["wpm"] for p in timeline])) if len(timeline) > 1 else 0,
        "ideal_low": IDEAL_LOW, "ideal_high": IDEAL_HIGH,
        "timeline": timeline,
    }
