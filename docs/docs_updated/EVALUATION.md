# Evaluation Approach

## Tutor: groundedness & unsupported-question handling

`backend/src/eval/runEval.js` is a small, fast, structural evaluation
harness (not model-graded) run with `npm run eval`. It seeds a throwaway
Project with a short, factual sample document (photosynthesis basics), then
asks four curated questions:

- Two **in-scope** questions the material clearly answers (expects
  `unsupported: false` and at least one citation).
- Two **out-of-scope** questions unrelated to the material (expects
  `unsupported: true` and zero citations).

It asserts the Tutor's `unsupported` flag and citation count match
expectations, prints a pass/fail table, and exits non-zero on any failure —
suitable for wiring into CI as a regression gate whenever prompts, the
retrieval scorer, or the model are changed. It's intentionally rule-based
rather than LLM-graded so it's free and deterministic to re-run often
during development, at the cost of not catching subtler quality issues
(e.g., a technically-cited-but-poorly-explained answer) that a model-graded
eval would.

Manual spot-checking during development additionally covered: asking
follow-up questions to confirm conversation continuity (recent turns +
rolling summary) actually changes answers, and confirming a question
phrased to look like an instruction embedded in uploaded material (a basic
prompt-injection probe) does not get followed.

## Retrieval

Covered by unit tests (`backend/src/tests/retrieval.test.js`) at the scoring
level: identical vectors score 1, orthogonal vectors score 0, empty vectors
never produce `NaN`, and partial term overlap scores strictly between 0 and
1. This validates the cosine-similarity math itself; end-to-end retrieval
quality (does the right chunk actually surface for a given question) is
exercised indirectly through the Tutor eval harness above, since a chunk
must be retrieved for the Tutor to cite it.

## Assessment (adaptive quiz)

Question **selection** (not question content) is covered by unit tests
(`backend/src/tests/quizSelection.test.js`), specifically asserting the
behavior the PRD calls out explicitly: it is not a pure
"wrong -> easier, correct -> harder" ladder. The tests confirm that (a) a
concept with very little evidence (low confidence) is prioritized over one
that's simply "known to be weak" with lots of evidence already, (b) a
concept with repeated consecutive mistakes is prioritized heavily, and (c)
a concept just asked about repeatedly is deprioritized in favor of others,
even at equal mastery/confidence.

Structured output reliability for AI-generated questions (MCQ shape,
open-ended grading shape) is enforced by requiring `response_format:
json_object` with an explicit schema in every prompt (see
`docs/ARCHITECTURE.md`); malformed JSON surfaces as a caught, logged error
rather than corrupting quiz state, since `JSON.parse` failures on these
paths propagate as a request error rather than a partial write.

Grading quality (does the feedback correctly identify what was understood
vs. missing) was spot-checked manually during development with a mix of
correct, partially-correct, and off-topic sample answers, since automated
grading-of-the-grader would need a second, independent judgment source
this prototype doesn't have.

## Recommendations

Not covered by an automated eval in this prototype — see
`docs/LIMITATIONS.md`. Manually spot-checked for relevance and
actionability against a few synthetic mastery states (a project with one
attention-flagged concept, a project with several improving concepts) to
confirm recommendations reference the correct concept names and read as
concrete next actions rather than generic advice.

## Mastery updates

Covered by unit tests (`backend/src/tests/masteryUpdate.test.js`) at the
trend-computation level (improving/stable/attention classification from a
history array). The confidence-weighted evidence blend itself
(`masteryService.applyEvidence`) is exercised indirectly through the
integration tests and manual quiz playthroughs, not isolated with its own
unit test, since it's tightly coupled to Mongo document state — see
`docs/LIMITATIONS.md`.
