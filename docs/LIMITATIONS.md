# Known Limitations

Honest accounting of what this prototype does not do, written from actually
building and testing it (not aspirational).

## AI / retrieval

- **Retrieval is TF-IDF, not embeddings.** Groq has no embeddings endpoint,
  so semantic similarity (e.g., matching a question to a passage that uses
  different wording for the same concept) is weaker than a real vector
  search would give. Exact/overlapping terminology retrieves well; heavy
  paraphrasing may not. See `docs/ARCHITECTURE.md` for the upgrade path.
- **No OCR for scanned PDFs.** Only text-layer PDFs are processed
  (`pdf-parse`); an image-only scanned document produces zero extractable
  text and the Material fails processing with a clear reason, rather than
  silently succeeding with no content.
- **Concept extraction runs on a sample, not the full document.** Large
  materials only have their first ~12 chunks sent for concept extraction,
  to bound token usage — concepts that only appear later in a long document
  may be missed.
- **Recommendations have no automated eval**, unlike the Tutor (see
  `docs/EVALUATION.md`) — only manual spot-checks were done.
- **Cost estimates are approximate**, not billing-accurate — a single
  blended per-1K-token rate is used in `aiService.js` rather than Groq's
  actual (and model-dependent) pricing.

## Background processing & jobs

- **The in-process job queue doesn't horizontally scale.** It's safe
  against double-processing (atomic `findOneAndUpdate`), but running
  multiple backend instances means multiple independent poll loops against
  the same collection, not coordinated work distribution. Fine for a
  prototype's single-instance deployment; would need BullMQ/SQS/etc. for
  real horizontal scaling (see `docs/ARCHITECTURE.md`).
- **No dead-letter queue or admin retry-trigger UI** — a job that
  exhausts its retries just sits as `status: failed`; the Admin Jobs tab
  shows it, but re-running it requires a new `enqueue` call, not a button.

## Testing

- **No end-to-end (browser) tests** — frontend correctness was verified via
  a successful production build (`vite build`) and manual code review, not
  automated UI testing (e.g., Playwright/Cypress).

## Security

- **Rate limiting is a single global limiter** (120 req/min per IP across
  all `/api/*` routes) rather than tuned per-endpoint (e.g., a stricter
  limit specifically on AI-triggering routes like `/tutor/ask` or
  `/quiz/*/answer`, which are the most expensive to abuse).
- **No email verification or password reset flow** — registration is
  immediate, and there's no account-recovery path.
- **Prompt-injection mitigation is instruction-based, not structurally
  enforced** — the Tutor's system prompt tells the model to treat material
  as data, not instructions, which reduces but doesn't guarantee immunity
  to adversarial content embedded in uploaded PDFs.

## Product scope

- **File storage is local disk by default** — fine for a single-instance
  deployment, but files won't survive a redeploy/restart on most PaaS
  providers with ephemeral filesystems unless `STORAGE_DRIVER=cloudinary`
  is configured and implemented (currently stubbed — see
  `storageService.js`).
- **No collaboration, notifications, or multi-modal (voice/image) learning
  features** — these were explicitly "Nice to Have" in the PRD and out of
  scope for this build.
- **Admin role must be set manually** (directly in MongoDB, or via the
  seed script's hardcoded demo admin) — there's no in-app promote-to-admin
  flow.
