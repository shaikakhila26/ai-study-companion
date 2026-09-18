# AI Usage

## AI used to build this product

Claude (Anthropic), via the Claude.ai chat interface with the code-execution
container, was used as a coding/development assistant for this entire
prototype: architecture planning, writing the backend (models, services,
controllers, routes, middleware, jobs), the frontend (React components and
pages), tests, the evaluation harness. See
`docs/DEVELOPMENT_PROMPTS.md` for the actual prompts used, organized by
area.

No other coding assistants, debugging tools, or design tools were used.

## AI used by the final product

The deployed application itself calls the **Groq API**
(`llama-3.3-70b-versatile` by default, configurable via `GROQ_MODEL`) for
five distinct features, each logged separately in `AIUsage` for
observability:

| Feature | Where | What it does |
|---|---|---|
| `tutor` | `tutorService.askTutor` | Answers learner questions grounded in retrieved Project material; decides (and self-reports) whether evidence is sufficient; may call the `get_concept_mastery` tool. |
| `concept_extraction` | `materialProcessorService.extractConcepts` | Identifies 4-10 key concepts from newly processed material, seeding `Concept`/`Mastery` records. |
| `quiz_generation` | `quizService.generateQuestion` | Generates one MCQ or open-ended question grounded in material for a chosen concept + difficulty. |
| `quiz_grading` | `quizService.gradeOpenAnswer` | Grades open-ended quiz answers for understanding/accuracy/relevance, returning explanatory feedback, not just a score. |
| `recommendation` | `recommendationService.generateRecommendations` | Converts mastery evidence into 1-3 specific "what to do next" recommendations. |

Retrieval itself (finding relevant material chunks) is **not** an AI call —
it's TF-IDF cosine similarity computed in `retrievalService.js` (see
`docs/ARCHITECTURE.md` for why). Mastery level updates
(`masteryService.applyEvidence`) are also not AI calls — they're a
deterministic confidence-weighted formula over quiz results.

Every one of the five AI features above funnels through the single
`aiService.chatComplete` wrapper, which logs model, prompt/completion
tokens, latency, an estimated cost, and success/failure to the `AIUsage`
collection for every call — visible in the Admin Dashboard's AI Usage tab
and each Project's Analytics tab.
