# Deployment

Live setup: **frontend on Vercel**, **backend on Render**, **database on
MongoDB Atlas**, **AI via Groq**.

## Order matters

Atlas → Render → Vercel → back to Render to set `CLIENT_URL`. The last step
exists because the backend needs to know the frontend's final URL for CORS,
which you don't have until Vercel has deployed.

## 1. MongoDB Atlas

Create a free M0 cluster, add a database user, and under Network Access
allow `0.0.0.0/0` (needed because Render's outbound IPs aren't fixed on the
free tier). Copy the connection string and append a database name.

## 2. Render (backend)

New Web Service → connect the repo → **root directory `backend`**.

- Build command: `npm install`
- Start command: `npm start`
- Instance type: Free

It must be a normal web service, **not** serverless — the background job
worker is an in-process poll loop and needs a long-running process.

Environment variables:

| Key | Notes |
|---|---|
| `NODE_ENV` | `production` — don't skip this, see below |
| `MONGODB_URI` | Atlas connection string |
| `JWT_SECRET` | long random string |
| `GROQ_API_KEY` | from console.groq.com |
| `GROQ_MODEL` | a current model, e.g. `openai/gpt-oss-120b` |
| `CLIENT_URL` | set after Vercel deploys; comma-separated list is allowed |
| `STORAGE_DRIVER` | `local` |

**`NODE_ENV=production` is not optional.** Without it the API returns full
stack traces to clients, exposing internal paths. The error handler fails
closed now, but setting the variable is still the correct fix and also
switches logging to combined format.

Verify with `/health` — it should report `"env": "production"`. `GET /`
returns a small JSON descriptor.

## 3. Vercel (frontend)

Import the repo → **root directory `frontend`**. Framework preset Vite,
build `npm run build`, output `dist`.

One environment variable: `VITE_API_BASE_URL` = the Render URL **ending in
`/api`** (e.g. `https://your-app.onrender.com/api`).

`frontend/vercel.json` provides the SPA rewrite so deep links like
`/projects/:id/tutor` don't 404 on refresh.

## 4. Back to Render

Set `CLIENT_URL` to the Vercel domain and redeploy.

## Free-tier behaviour to expect

None of these are bugs — they're the free tier, and worth knowing before
recording a demo:

- **Cold starts around a minute.** The instance sleeps when idle. Hit
  `/health` a minute before you need it responsive.
- **The disk is ephemeral.** PDFs in `backend/uploads/` are wiped on every
  redeploy and restart. Chunks and concepts persist in Mongo so the Tutor
  and Quiz keep working on already-processed material, but the original
  file is gone and anything trying to read it hits `ENOENT`. Implementing
  the stubbed Cloudinary branch in `storageService.js` is the real fix.
- **The job worker sleeps with the instance.** Job state is persisted in
  Mongo with idempotency keys, so queued work resumes on wake without
  double-processing — but a PDF uploaded right before spin-down waits.

## Demo checklist

1. Wake the backend (`/health`) a minute beforehand.
2. Re-upload a text-layer PDF, since earlier uploads may have been wiped.
3. Wait for status to reach **ready** before using Tutor or Quiz.
4. Have the admin account ready for the Admin dashboard section.
