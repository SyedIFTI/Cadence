"""Shared text helpers: the spaCy model, word alignment and syllable counting."""
import re
from functools import lru_cache

import spacy


@lru_cache(maxsize=1)
def nlp():
    """Load spaCy once. It gives us tokens, POS tags, lemmas and dependency trees."""
    return spacy.load("en_core_web_sm", disable=["ner"])


def align_words(text: str, words: list[dict]) -> list[dict]:
    """Find where each Whisper word sits in the text.

    Whisper gives us timestamps per word, spaCy gives us character positions.
    Knowing both lets us put a time on everything spaCy finds.
    """
    aligned, cursor = [], 0
    lowered = text.lower()
    for item in words:
        core = item["word"].strip(" .,!?;:\"").lower()
        if not core:
            continue
        # Only look a little ahead, so one mismatch cannot skip half the text.
        position = lowered.find(core, cursor, cursor + len(core) + 60)
        if position == -1:
            continue
        aligned.append({"start": item["start"], "end": max(item["end"], item["start"]),
                        "char_start": position, "char_end": position + len(core)})
        cursor = position + len(core)
    # Each word's display text runs up to the next word, so punctuation is kept.
    for index, word in enumerate(aligned):
        stop = aligned[index + 1]["char_start"] if index + 1 < len(aligned) else len(text)
        begin = 0 if index == 0 else word["char_start"]
        word["text"] = text[begin:stop].strip()
    return aligned


def is_word(token) -> bool:
    """True for real words. Clitics such as n't and 's belong to the word before."""
    return any(c.isalnum() for c in token.text) and "'" not in token.text and "’" not in token.text


def count_syllables(word: str) -> int:
    """Estimate syllables by counting groups of vowels."""
    word = re.sub(r"[^a-z]", "", word.lower())
    if not word:
        return 1
    count = len(re.findall(r"[aeiouy]+", word))
    if word.endswith("e") and not word.endswith(("le", "ee")) and count > 1:
        count -= 1  # silent e, as in "make"
    return max(count, 1)
