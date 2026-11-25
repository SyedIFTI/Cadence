"""Vocabulary richness. Filler tokens are left out so they do not distort it."""
from collections import Counter

from .text import is_word

CONTENT_POS = {"NOUN", "PROPN", "VERB", "ADJ", "ADV"}
POS_NAMES = {"NOUN": "Nouns", "PROPN": "Nouns", "VERB": "Verbs", "AUX": "Verbs", "ADJ": "Adjectives",
             "ADV": "Adverbs", "PRON": "Pronouns"}


def moving_average_ttr(lemmas: list[str], window: int = 50) -> float:
    """MATTR: the type-token ratio averaged over a sliding window.

    Plain TTR always drops as a text gets longer, so long talks would look
    poor. A fixed window makes short and long talks comparable.
    """
    if not lemmas:
        return 0.0
    if len(lemmas) <= window:
        return len(set(lemmas)) / len(lemmas)
    ratios = [len(set(lemmas[i:i + window])) / window for i in range(len(lemmas) - window + 1)]
    return sum(ratios) / len(ratios)


def analyze(doc, skip: set[int]) -> dict:
    tokens = [t for t in doc if is_word(t) and t.i not in skip]
    lemmas = [t.lemma_.lower() for t in tokens]
    total, counts = max(len(lemmas), 1), Counter(lemmas)
    content = [t for t in tokens if t.pos_ in CONTENT_POS]
    parts = Counter(POS_NAMES.get(t.pos_, "Other") for t in tokens)
    keywords = Counter(t.lemma_.lower() for t in content
                       if t.pos_ in {"NOUN", "PROPN", "ADJ", "VERB"} and not t.is_stop and len(t.text) > 2)
    return {
        "total": len(lemmas),
        "unique": len(counts),
        "ttr": round(len(counts) / total, 2),
        "mattr": round(moving_average_ttr(lemmas), 2),
        "lexical_density": round(100 * len(content) / total),
        "used_once_percent": round(100 * sum(c == 1 for c in counts.values()) / max(len(counts), 1)),
        "average_length": round(sum(len(t.text) for t in tokens) / total, 1),
        "parts_of_speech": [{"label": l, "percent": round(100 * c / total)} for l, c in parts.most_common()],
        "keywords": [{"word": w, "count": c} for w, c in keywords.most_common(10)],
    }
