"""Sentence complexity: length, readability and grammar structure."""
from .text import count_syllables, is_word

# Dependency labels that mark a clause nested inside another clause.
SUBORDINATE = {"advcl", "ccomp", "acl", "relcl", "csubj", "csubjpass"}


def tree_depth(token) -> int:
    """Height of the dependency tree below a token."""
    return 1 + max((tree_depth(child) for child in token.children), default=0)


def label_for(length: int, depth: int) -> str:
    if length > 30 or depth > 9:
        return "complex"
    if length > 18 or depth > 6:
        return "moderate"
    return "simple"


def analyze(doc, skip: set[int]) -> dict:
    sentences, words, syllables = [], 0, 0
    for sentence in doc.sents:
        tokens = [t for t in sentence if is_word(t) and t.i not in skip]
        if not tokens:
            continue
        depth = tree_depth(sentence.root)
        words += len(tokens)
        syllables += sum(count_syllables(t.text) for t in tokens)
        sentences.append({
            "text": sentence.text.strip(), "words": len(tokens), "depth": depth,
            "subordinate": sum(t.dep_ in SUBORDINATE for t in tokens),
            "level": label_for(len(tokens), depth),
        })

    n, words = max(len(sentences), 1), max(words, 1)
    per_sentence, per_word = words / n, syllables / words
    return {
        "sentence_count": len(sentences),
        "average_length": round(per_sentence, 1),
        "average_depth": round(sum(s["depth"] for s in sentences) / n, 1),
        "subordinate_per_sentence": round(sum(s["subordinate"] for s in sentences) / n, 1),
        # Flesch formulas: higher ease = simpler, grade = US school year.
        "flesch_ease": round(max(0, min(100, 206.835 - 1.015 * per_sentence - 84.6 * per_word))),
        "flesch_grade": round(max(0, 0.39 * per_sentence + 11.8 * per_word - 15.59), 1),
        "levels": {k: sum(s["level"] == k for s in sentences) for k in ("simple", "moderate", "complex")},
        "sentences": sentences,
    }
