# Known Limitations

I'm writing this the way I'd actually explain the project in a review, not
as a polished marketing-style caveats list. That includes the bugs I hit
and fixed along the way, because I found most of them by running the thing
against real MongoDB Atlas and real Groq and actually using it — not by
reading my own code — and I think how they were found matters as much as
the fact they're fixed.

## Bugs I found by testing, and fixed

- **The retrieval tokenizer was silently deleting "AI", "ML", "DL".** My
  tokenizer dropped any token 2 characters or shorter. For a study app
  where someone uploads AI/ML material, that's the worst possible filter —
  the Tutor would answer "I don't have enough evidence" to a question the
  PDF plainly answered, because the words connecting the question to the
  material had already been thrown away before scoring. I only caught it
  by comparing my app's answer against what another tool gave me for the
  same PDF and question. Fixed to only drop 1-character tokens. Material
  uploaded before the fix had to be re-uploaded, since chunks were indexed
  with the old tokenizer.
- **Quiz questions were repetitive because concept-specific grounding
  never actually worked.** Question generation queried a `Chunk.concepts`
  field that nothing in my pipeline ever populated, so the "find chunks for
  this concept" lookup silently fell through to a generic fallback — the
  same first few chunks — for every question regardless of concept or
  difficulty. Fixed by reusing the same TF-IDF retrieval the Tutor uses,
  scoped to the concept name, plus an explicit "don't repeat these" clause
  in the prompt and a higher temperature.
- **Growth showed almost everything as "Stable" forever.** Trend needed 3
  evidence points on a concept before it would report improving or needs-
  attention, but an 8-question quiz spread over 5-10 concepts rarely gives
  any single concept that much. Lowered to 2.
- **A quiz crashed on question 2 onward** because mastery records store the
  field as `conceptName` while the quiz code read `concept.name` — always
  `undefined` once real mastery data existed, failing schema validation.
- **My integration tests were silently skipping 100% of the time.** I had
  them `test.skip()` when no database was reachable, based on a flag set in
  `beforeAll`. Jest registers every test (and evaluates skip/run) *before*
  any `beforeAll` runs, so that flag was always at its initial value — the
  tests never ran, connected database or not, and nothing errored to tell
  me. Rewrote so each test checks the flag itself at run time. This one
  bothers me the most in hindsight: a test suite that always passes because
  it never runs is worse than no test suite.
- **Groq rejects `response_format: json_object` combined with `tools`** in
  one request, and the `gpt-oss` models will additionally try to call a
  non-existent `"json"` tool if you ask for JSON while tools are attached.
  Fixed by splitting tool-decision and JSON-answer generation into two
  separate calls that never combine the two.

## AI / retrieval

- **Retrieval is TF-IDF, not embeddings.** Groq has no embeddings endpoint,
  so I'd have needed a second provider or a local model. TF-IDF is
  deterministic, free, and needs no extra service — but it matches on
  shared vocabulary, so a question phrased completely differently from the
  source text retrieves worse than real vector search would.
- **No OCR.** Only text-layer PDFs work. The PRD notes documents may
  contain images, diagrams, tables or scanned pages — I don't handle the
  image/scanned side. A scanned PDF fails with a clear reason rather than
  silently indexing nothing, but it does fail. Adding OCR (Tesseract or a
  cloud OCR API) was the obvious next step and I chose to spend the time on
  the core learning loop instead. Tables and diagrams inside text-layer
  PDFs get flattened to whatever text `pdf-parse` extracts, so their
  structure is lost.
- **Concept extraction only reads a sample** (~12 chunks) of a document to
  keep token usage bounded, so concepts appearing late in a long PDF can be
  missed.
- **Model names get deprecated with no warning.** Mid-build,
  `llama-3.3-70b-versatile` and `llama-3.1-8b-instant` were decommissioned
  on Groq's free tier and I had to move to `openai/gpt-oss-120b` /
  `-20b`. If you clone this and get a `model_not_found` 404, set
  `GROQ_MODEL` / `GROQ_EVAL_MODEL` in `.env` to a current model from
  console.groq.com/docs/models.
- **Cost figures are estimates**, using one blended per-1K-token rate, not
  Groq's real per-model pricing. Good enough to compare features against
  each other, not to reconcile against a bill.

## Performance

- **Quiz "Next Question" is slow — often several seconds, sometimes much
  longer.** Every next question is a live model call that has to generate a
  grounded question from scratch, and on Groq's free tier that call can
  queue. This is the weakest part of the UX. The honest fixes are
  pre-generating the next question in the background while the learner is
  still answering the current one, and/or using a smaller model for
  question generation — neither of which is in this build.
- **Open-ended answers add a second call** (grading), so those questions
  feel slower still.
- **No caching anywhere.** Repeated identical Tutor questions re-run
  retrieval and re-call the model.

## Deployment (Render free tier)

These are real constraints I hit after deploying, not hypotheticals:

- **The disk is ephemeral.** Uploaded PDFs written to `backend/uploads/`
  are wiped on every redeploy and restart. Chunks and concepts live in
  MongoDB, so the Tutor and Quiz keep working on already-processed
  material — but the original file is gone, and any job that tries to read
  it fails with `ENOENT`. The Cloudinary path in `storageService.js` is
  stubbed for exactly this and isn't implemented.
- **Cold starts take roughly a minute.** The free instance spins down when
  idle. Worth hitting `/health` a minute before demoing anything.
- **The background worker sleeps with the instance.** My job queue is an
  in-process poll loop, so it stops when the service spins down. Job state
  is persisted in Mongo with idempotency keys, so nothing is lost or
  double-processed and queued work resumes on wake — but a PDF uploaded
  immediately before spin-down sits queued until something wakes the
  service.
- **Stale `failureReason` on materials.** If processing fails once and then
  succeeds on a later run, I set status back to `ready` but never cleared
  the old `failureReason`, and the UI renders it whenever present. So a
  perfectly healthy material can still show a red error string from a
  previous failed attempt. Cosmetic — the material is genuinely usable —
  but misleading, and I'd clear that field on success.

## Testing

- **Integration tests need `TEST_MONGODB_URI` set separately** from the
  app's own `MONGODB_URI`, deliberately: the suite calls `dropDatabase()`
  when it finishes and I didn't want that pointed anywhere near real data.
- **The eval harness makes real Groq calls**, so it costs real API usage
  each run, and its results print to the terminal only.
- **No browser/end-to-end tests.** The frontend is verified by a clean
  production build plus manual walkthroughs, not Playwright or Cypress.

## Security

- **Rate limiting is one global bucket** (120 req/min per IP across all
  `/api/*`), not tightened specifically on the expensive AI routes.
- **No email verification or password reset.**
- **Prompt-injection defence is instruction-based.** I tell the model to
  treat uploaded material as data and never as instructions, which helps,
  but it isn't a structural guarantee against a hostile PDF.
- **Admin role is set manually** in MongoDB or via the seed script — no
  in-app promotion flow.

## Scope

- No collaboration, notifications, voice, or multi-modal learning — all
  "Nice to Have" in the brief and deliberately out of scope.
- The Tutor is a grounded question-answering interface. It can't generate
  downloadable files (I asked it for a PDF summary while testing and it
  correctly told me it couldn't), and that's intended behaviour, not a gap
  I meant to fill.
