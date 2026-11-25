"""Turn measurements into 0-100 scores.

Every score is a straight-line lookup between hand-picked points, so each
number can be explained: "6 fillers per 100 words gives 50".
"""

WEIGHTS = {"fillers": 25, "pace": 20, "clarity": 20, "vocabulary": 15, "complexity": 10, "pauses": 10}
NAMES = {"fillers": "Filler words", "pace": "Pace", "clarity": "Clarity", "vocabulary": "Vocabulary",
         "complexity": "Sentences", "pauses": "Pauses"}


def interpolate(x: float, points: list[tuple[float, float]]) -> float:
    if x <= points[0][0]:
        return points[0][1]
    for (x1, y1), (x2, y2) in zip(points, points[1:]):
        if x <= x2:
            return y1 + (y2 - y1) * (x - x1) / (x2 - x1)
    return points[-1][1]


def score_fillers(f: dict) -> float:
    return interpolate(f["per_100_words"], [(0, 100), (1, 95), (3, 78), (6, 50), (10, 20), (15, 0)])


def score_pace(p: dict) -> float:
    return interpolate(p["wpm"], [(50, 10), (90, 55), (120, 100), (160, 100), (190, 60), (230, 10)])


def score_pauses(p: dict, duration: float) -> float:
    silence = interpolate(p["silence_percent"], [(0, 70), (4, 100), (20, 100), (35, 55), (60, 0)])
    long_per_minute = p["long"] / max(duration / 60, 0.5)
    return max(0, silence - 8 * long_per_minute)


def score_vocabulary(v: dict) -> float:
    variety = interpolate(v["mattr"], [(0.45, 10), (0.6, 40), (0.72, 72), (0.8, 90), (0.88, 100)])
    density = interpolate(v["lexical_density"], [(25, 20), (40, 75), (48, 100), (65, 100), (80, 70)])
    return 0.7 * variety + 0.3 * density


def score_complexity(c: dict) -> float:
    length = interpolate(c["average_length"], [(3, 30), (9, 90), (12, 100), (18, 100), (28, 55), (45, 5)])
    depth = interpolate(c["average_depth"], [(2, 60), (4, 100), (7, 100), (10, 55), (14, 15)])
    return 0.6 * length + 0.4 * depth


def score_clarity(c: dict, f: dict, e: dict, words: int) -> float:
    """Clarity mixes: easy to read, direct (few hedges), smooth (few repeats, few fillers)."""
    per_100 = 100 / max(words, 1)
    readable = interpolate(c["flesch_ease"], [(10, 10), (30, 45), (50, 75), (65, 100)])
    direct = interpolate(e["hedge_total"] * per_100, [(0, 100), (1, 90), (3, 55), (6, 10)])
    smooth = interpolate(e["repeat_total"] * per_100, [(0, 100), (1, 80), (3, 40), (6, 0)])
    return 0.4 * readable + 0.2 * direct + 0.2 * smooth + 0.2 * score_fillers(f)


def level(score: float) -> str:
    return "Excellent" if score >= 85 else "Good" if score >= 70 else "Fair" if score >= 50 else "Needs work"


def build_tips(r: dict) -> list[dict]:
    tips = []

    def add(area, kind, text):
        tips.append({"area": NAMES[area], "kind": kind, "text": text})

    f, p, s, v, c, e = (r[k] for k in ("fillers", "pace", "pauses", "vocabulary", "complexity", "extras"))
    if f["per_100_words"] > 3:
        top = f["counts"][0]
        times = "once" if top["count"] == 1 else f"{top['count']} times"
        add("fillers", "improve", f"You said “{top['label']}” {times}. Try a short silent pause instead.")
    elif f["per_100_words"] <= 1.5:
        add("fillers", "good", "Very few fillers. Your speech sounds confident.")
    if p["wpm"] > p["ideal_high"]:
        add("pace", "improve", f"{p['wpm']} WPM is fast. Aim for {p['ideal_low']}–{p['ideal_high']} so listeners can keep up.")
    elif p["wpm"] < p["ideal_low"]:
        add("pace", "improve", f"{p['wpm']} WPM is slow. Aim for {p['ideal_low']}–{p['ideal_high']} to hold attention.")
    else:
        add("pace", "good", f"{p['wpm']} WPM is a comfortable presenting pace.")
    if s["long"]:
        add("pauses", "improve", f"{s['long']} pause{'s' if s['long'] > 1 else ''} lasted 2 seconds or more. Practise the points where you get stuck.")
    elif s["silence_percent"] < 2 and r["duration"] > 20:
        add("pauses", "improve", "You hardly paused. Breathe between ideas so they can land.")
    if r["score"]["parts"]["vocabulary"] < 70:
        add("vocabulary", "improve", "Many words repeat. Swap a few frequent ones for more specific words.")
    elif r["score"]["parts"]["vocabulary"] >= 85:
        add("vocabulary", "good", "Varied word choice keeps the talk interesting.")
    if c["average_length"] > 20:
        add("complexity", "improve", f"Sentences average {c['average_length']} words. Split the long ones in two.")
    elif c["average_length"] < 8:
        add("complexity", "improve", "Most sentences are very short. Link related ideas together.")
    if e["hedge_total"] >= 3:
        add("clarity", "improve", f"{e['hedge_total']} hedging phrases such as “{e['hedges'][0]['label']}”. State your point directly.")
    if e["repeat_total"] >= 2:
        add("clarity", "improve", f"{e['repeat_total']} words were repeated back to back. Slow down before new sentences.")
    return sorted(tips, key=lambda t: t["kind"] == "good")  # improvements first


def analyze(r: dict) -> dict:
    parts = {
        "fillers": score_fillers(r["fillers"]),
        "pace": score_pace(r["pace"]),
        "clarity": score_clarity(r["complexity"], r["fillers"], r["extras"], r["pace"]["word_count"]),
        "vocabulary": score_vocabulary(r["vocabulary"]),
        "complexity": score_complexity(r["complexity"]),
        "pauses": score_pauses(r["pauses"], r["duration"]),
    }
    overall = sum(parts[k] * WEIGHTS[k] for k in parts) / 100
    return {"overall": round(overall), "level": level(round(overall)), "parts": {k: round(v) for k, v in parts.items()},
            "weights": WEIGHTS, "names": NAMES}
