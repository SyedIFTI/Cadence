"""Filler words.

Counting the string "like" is not enough: "I like tea" is fine, "it was, like,
huge" is a filler. We use spaCy's POS tags and the neighbouring words to decide.
"""
from collections import Counter

HESITATIONS = {"um", "umm", "uh", "uhh", "uhm", "er", "err", "erm", "hmm", "hm", "mm", "ah", "eh"}
CRUTCHES = {"basically", "actually", "literally", "honestly", "obviously", "essentially"}
# Words that turn "you know" into a real clause, e.g. "you know what I mean".
CLAUSE_WORDS = {"what", "how", "why", "who", "where", "when", "that", "if", "about", "the", "it"}


def is_filler_like(doc, i: int) -> bool:
    token = doc[i]
    if token.pos_ == "VERB":
        return False                       # "I like music"
    following = doc[i + 1] if i + 1 < len(doc) else None
    if following is not None and following.text == ",":
        return True                        # "it was like, huge"
    if token.pos_ == "INTJ":
        return True                        # spaCy already sees an interjection
    if any(child.dep_ == "pobj" for child in token.children):
        return False                       # "languages like Python"
    return following is not None and following.pos_ in {"ADV", "AUX", "INTJ"}


def match_at(doc, i: int):
    """Return (length in tokens, label, kind) if a filler starts at token i."""
    word = doc[i].lower_
    following = doc[i + 1].lower_ if i + 1 < len(doc) else ""
    previous = doc[i - 1].lower_ if i > 0 else ""
    after = doc[i + 2].lower_ if i + 2 < len(doc) else ""
    sentence_start = i == doc[i].sent.start

    if word in HESITATIONS:
        return 1, word, "hesitation"
    if word == "you" and following == "know":
        if previous not in {"do", "did", "if", "as", "that", "let", "can", "would"} and after not in CLAUSE_WORDS:
            return 2, "you know", "discourse"
    if word == "i" and following == "mean" and (after == "," or sentence_start or previous == ","):
        return 2, "I mean", "discourse"
    if word in {"kind", "sort"} and following == "of":
        # "this kind of food" is a normal noun phrase, "it's kind of big" is not.
        if previous not in {"a", "the", "this", "that", "any", "some", "what", "every", "each", "same"} \
                and doc[i].i and doc[i - 1].pos_ not in {"ADJ", "DET"}:
            return 2, f"{word} of", "discourse"
    if word == "like" and is_filler_like(doc, i):
        return 1, "like", "discourse"
    if word in {"so", "well", "okay", "right"} and sentence_start and following == ",":
        return 1, word, "discourse"
    if word in CRUTCHES:
        return 1, word, "crutch"
    return None


def analyze(doc, words: list[dict]) -> dict:
    found, i = [], 0
    while i < len(doc):
        match = match_at(doc, i)
        if match is None:
            i += 1
            continue
        length, label, kind = match
        start, last = doc[i], doc[i + length - 1]
        end_char = last.idx + len(last)
        indexes = [n for n, w in enumerate(words)
                   if w["char_start"] < end_char and w["char_end"] > start.idx]
        found.append({"label": label, "kind": kind, "words": indexes,
                      "time": words[indexes[0]]["start"] if indexes else None,
                      "tokens": list(range(i, i + length))})
        i += length

    counts = Counter(item["label"] for item in found)
    kinds = {item["label"]: item["kind"] for item in found}
    total_words = max(len(words), 1)
    return {
        "total": len(found),
        "per_100_words": round(100 * len(found) / total_words, 1),
        "counts": [{"label": l, "count": c, "kind": kinds[l]} for l, c in counts.most_common()],
        "found": found,
    }
