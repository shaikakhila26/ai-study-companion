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
