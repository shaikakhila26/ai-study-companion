# Future Improvements

With additional development time, roughly in priority order:

1. **Swap TF-IDF retrieval for real embeddings** (e.g., an
   OpenAI/Cohere/local embedding model + Mongo Atlas Vector Search or
   pgvector), improving recall on paraphrased questions. The `Chunk` schema
   and `retrievalService.js` interface were deliberately shaped so this is
   a contained change.
2. **Move background jobs to BullMQ + Redis** for real horizontal scaling
   and a proper dead-letter queue / admin retry UI, once the workload
   justifies the extra infrastructure.
3. **OCR for scanned PDFs** (e.g., Tesseract or a cloud OCR API) so
   image-only documents aren't a hard failure.
4. **Streaming Tutor responses** — return tokens as they generate instead
   of waiting for the full JSON response, for a snappier chat feel (listed
   as "Should Have" in the PRD).
5. **Automated, model-graded evaluation** for recommendation quality and
   quiz grading quality (an LLM-as-judge pass), complementing the current
   rule-based Tutor eval — and wiring `npm run eval` into CI as a
   regression gate.
6. **Per-endpoint rate limiting**, tightest on AI-triggering routes, plus
   basic abuse detection (e.g., flagging accounts issuing implausible
   volumes of Tutor questions).
7. **Spaced repetition / flashcards** built on top of the existing Mastery
   data — a natural "Nice to Have" extension since the mastery/confidence
   model already tracks what needs reinforcement and when it was last
   evidenced.
8. **Email verification + password reset**, and an in-app admin-promotion
   flow instead of a manual/seed-only path.
9. **Cloudinary (or S3) storage wired up for real**, so deployments with
   ephemeral filesystems don't lose uploaded material on restart.
10. **Concept maps / learning plans** — a visual representation of how a
    Project's concepts relate to each other and to the stated goal, beyond
    the current flat mastery list.

## Added after deploying and testing

Ordered by how much they'd actually improve the product, based on what I
hit using it rather than what sounds impressive:

1. **Pre-generate the next quiz question in the background** while the
   learner is still answering the current one. The multi-second "Next
   Question" wait is the single worst part of the UX right now, and it's
   entirely a serial-AI-call problem — nothing needs that call to happen
   *after* the answer is submitted.
2. **OCR for scanned PDFs and better handling of tables and diagrams.** The
   brief explicitly mentions documents containing images, diagrams, tables
   and scanned pages; I only handle text-layer PDFs, and table structure is
   lost when flattened to text.
3. **Implement the Cloudinary storage branch** so uploaded PDFs survive a
   redeploy. The stub is already there — this is the fix for the ephemeral-
   disk problem, not a workaround for it.
4. **Clear `failureReason` when processing later succeeds**, so a healthy
   material stops showing a stale error message.
5. **Persist eval results and surface them in the Admin dashboard.** Right
   now `npm run eval` prints to a terminal, which means the "AI evaluation"
   the admin view promises isn't really visible to an admin.
6. **Give the Tutor more application capabilities as validated tools** —
   searching materials on demand and identifying weak concepts, beyond the
   single mastery lookup it has now.
7. **Feed assessment history into the Tutor's context automatically**, so
   it knows what the learner recently got wrong without having to ask.
8. **Streaming Tutor responses**, so long answers feel immediate instead of
   arriving all at once after a pause.
