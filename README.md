# AI Study Companion

An AI-powered learning workspace: Spaces → Projects → upload material → learn
with a grounded AI Tutor → take an adaptive quiz → track concept mastery →
see growth over time → get a recommended next action. Includes an Admin
Dashboard for platform-wide visibility.

Built as a candidate take-home prototype (see `Project_Requirements.pdf` /
the original PRD for full scope). This README covers setup, running, and
deployment. See `/docs` for architecture, AI usage, evaluation approach,
known limitations, and future improvements.

## Stack

- **Frontend:** React 18 + Vite + Tailwind CSS + React Router
- **Backend:** Node.js + Express + Mongoose (MongoDB)
- **Auth:** JWT + bcrypt
- **AI:** Groq (`llama-3.3-70b-versatile`) via the `groq-sdk`
- **Retrieval:** self-contained TF-IDF cosine similarity (see `docs/ARCHITECTURE.md` for why, given Groq has no embeddings endpoint)
- **Background jobs:** in-process async queue backed by a Mongo `Job` collection (see `docs/ARCHITECTURE.md` for the tradeoff vs. BullMQ/Redis)
- **File storage:** local disk by default (swappable to Cloudinary — see `backend/src/services/storageService.js`)

## Project structure

```
ai-study-companion/
├── backend/          Express API, AI services, background jobs, tests, eval harness
├── frontend/          React + Vite SPA
└── docs/              Architecture, AI usage, evaluation, limitations, future work
```

## Prerequisites

- Node.js 18+
- A MongoDB instance (local `mongod`, Docker, or a free Atlas cluster)
- A [Groq API key](https://console.groq.com) (free tier is sufficient)

## Local setup

### 1. Backend

```bash
cd backend
cp .env.example .env
# edit .env: set MONGODB_URI, JWT_SECRET, GROQ_API_KEY at minimum
npm install
npm run seed     # optional: creates admin@example.com / admin12345 and learner@example.com / learner12345
npm run dev      # starts the API on http://localhost:5000, and the background job worker in-process
```

### 2. Frontend

```bash
cd frontend
cp .env.example .env   # VITE_API_BASE_URL=http://localhost:5000/api
npm install
npm run dev             # starts the SPA on http://localhost:5173
```

Open `http://localhost:5173`, register an account (or log in with the seeded
demo accounts above), create a Space and Project, upload a PDF, and try the
Tutor / Quiz / Growth / Analytics flows. Log in as `admin@example.com` to see
`/admin`.

## Running tests

```bash
cd backend
npm test
```

Pure-logic unit tests (retrieval scoring, adaptive question selection,
mastery trend calculation, chunking) run with no external dependencies.
Integration tests (auth, registration, Project data isolation) require a
reachable MongoDB and self-skip if one isn't available — run them for real
with `MONGODB_URI=... npm test`.

## Running the AI evaluation harness

```bash
cd backend
npm run eval
```

Requires a reachable MongoDB and a valid `GROQ_API_KEY` (it makes real AI
calls). See `docs/EVALUATION.md` for what it checks and why.

## Deployment

This repo is deploy-ready but was not deployed from within the sandbox this
was built in (no outbound access to hosting providers). Recommended path,
matching the stack above:

- **Backend:** Render, Railway, or Fly.io (needs a long-running Node
  process for the in-process background worker — do **not** deploy it as a
  serverless function, or queued jobs won't get processed between requests).
- **Database:** MongoDB Atlas (free M0 tier is enough for a prototype).
- **Frontend:** Vercel or Netlify, static build (`npm run build`, root `dist/`). Set `VITE_API_BASE_URL` to the deployed backend's `/api` URL.

Environment variables to set on the backend host: everything in
`backend/.env.example`, especially `MONGODB_URI`, `JWT_SECRET`, and
`GROQ_API_KEY`. Never commit `.env` — only `.env.example` is checked in.

## Documentation

- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — architecture diagram and key decisions
- [`docs/AI_USAGE.md`](docs/AI_USAGE.md) — AI used to build vs. AI used by the product
- [`docs/DEVELOPMENT_PROMPTS.md`](docs/DEVELOPMENT_PROMPTS.md) — development prompts used
- [`docs/EVALUATION.md`](docs/EVALUATION.md) — how Tutor/retrieval/assessment/recommendation quality was evaluated
- [`docs/LIMITATIONS.md`](docs/LIMITATIONS.md) — known limitations
- [`docs/FUTURE_IMPROVEMENTS.md`](docs/FUTURE_IMPROVEMENTS.md) — what's next with more time
