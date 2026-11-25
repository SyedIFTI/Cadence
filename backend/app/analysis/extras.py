"""Extras: hedging phrases, repeated words and passive voice."""
import re
from collections import Counter

from .text import is_word

HEDGES = ["i think", "i guess", "i feel like", "maybe", "perhaps", "probably", "possibly",
          "i suppose", "i'm not sure", "might be", "could be", "a little bit", "or something", "or whatever"]
HEDGE_PATTERN = re.compile(r"\b(" + "|".join(re.escape(h) for h in HEDGES) + r")\b", re.IGNORECASE)
# Doubling these is usually emphasis or grammar, not a stumble.
ALLOWED_REPEATS = {"very", "really", "so", "had", "that", "no", "yes", "many", "much"}


def analyze(doc, skip: set[int], words: list[dict]) -> dict:
    text = doc.text.replace("’", "'")
    hedges = Counter(m.group(1).lower() for m in HEDGE_PATTERN.finditer(text))

    spoken = [t for t in doc if is_word(t) and t.i not in skip]
    repeats = []
    for first, second in zip(spoken, spoken[1:]):
        same = first.lower_ == second.lower_ and first.lower_ not in ALLOWED_REPEATS
        if same and first.sent == second.sent:
            index = next((n for n, w in enumerate(words)
                          if w["char_start"] <= second.idx < w["char_end"]), None)
            repeats.append({"word": second.lower_, "index": index})

    return {
        "hedges": [{"label": l, "count": c} for l, c in hedges.most_common()],
        "hedge_total": sum(hedges.values()),
        "repeats": repeats,
        "repeat_total": len(repeats),
        "passive_sentences": sum(any(t.dep_ in {"nsubjpass", "csubjpass"} for t in s) for s in doc.sents),
    }
