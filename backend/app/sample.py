"""A built-in practice speech, so the app can be shown without audio or an API key.

Only the transcript and its timings are made up. The analysis is the real one.
"""
TEXT = (
    "So, good morning everyone. Um, today I want to talk about, uh, renewable energy and why it matters "
    "for our city. Every year we use more electricity, and most of it still comes from fossil fuels. "
    "Basically, that means higher costs and, you know, more pollution in the air that we breathe. "
    "I think solar panels are, like, really the easiest place to start. "
    "Our our school roof gets almost six hours of sunlight each day, which is enough to power every classroom. "
    "Um, some people say that panels are expensive, and I mean, they are right about the first payment. "
    "However, prices have fallen by more than half in the last ten years. "
    "When a community shares the cost, the savings usually cover the investment within seven years. "
    "We also like the idea because it creates local jobs for technicians and engineers. "
    "Uh, maybe the biggest benefit is that students can learn from a real project instead of a textbook. "
    "They could measure the output, compare the seasons, and share the results with other schools. "
    "So, I ask you to support this plan. Small changes on one roof can inspire a whole neighbourhood. Thank you."
)


def transcript() -> dict:
    words, clock, sentences = [], 0.4, 0
    for position, raw in enumerate(TEXT.split()):
        clean = raw.strip(".,")
        length = 0.16 + 0.045 * len(clean)
        words.append({"word": clean, "start": round(clock, 2), "end": round(clock + length, 2)})
        clock += length + 0.03
        if raw.endswith("."):
            sentences += 1
            clock += 2.3 if sentences == 5 else 1.1 if sentences in (3, 11) else 0.75
        elif raw.endswith(","):
            clock += 0.28
        # Speed up in the middle third so the pace chart has something to show.
        if 70 < position < 130:
            clock -= 0.09
    return {"text": TEXT, "duration": round(clock, 2), "words": words}
