const Chunk = require('../models/Chunk');
const { tokenize, termFrequency } = require('../utils/text');
const env = require('../config/env');

/**
 * Retrieval strategy: TF-IDF cosine similarity computed at query time over a
 * single Project's chunks.
 *
 * Why not embeddings: Groq (our chosen provider) does not expose an
 * embeddings endpoint, and pulling in a second provider or downloading a
 * local embedding model just for retrieval would add cost/complexity out of
 * proportion to a 3-4 day prototype. TF-IDF keeps retrieval deterministic,
 * fast, and fully self-contained. It is a documented simplification --
 * see docs/LIMITATIONS.md -- and the Chunk schema is shaped so swapping in
 * a vector index (Mongo Atlas Vector Search, pgvector, Pinecone, etc.) later
 * only touches this file.
 *
 * Crucially, retrieval (and therefore every AI answer) is always scoped to
 * `project`, which is what "Context First" (PRD section 2) requires:
 * information from unrelated Projects must never leak into an answer.
 */

function cosineSim(vecA, vecB) {
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (const key of Object.keys(vecA)) {
    normA += vecA[key] * vecA[key];
    if (vecB[key]) dot += vecA[key] * vecB[key];
  }
  for (const key of Object.keys(vecB)) {
    normB += vecB[key] * vecB[key];
  }
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

async function buildIdf(projectId) {
  const chunks = await Chunk.find({ project: projectId }).select('termFreq').lean();
  const docFreq = {};
  for (const c of chunks) {
    const seen = new Set(Object.keys(c.termFreq || {}));
    for (const term of seen) docFreq[term] = (docFreq[term] || 0) + 1;
  }
  const N = chunks.length || 1;
  const idf = {};
  for (const term of Object.keys(docFreq)) {
    idf[term] = Math.log((N + 1) / (docFreq[term] + 1)) + 1;
  }
  return idf;
}

function toTfIdfVector(termFreqMap, idf) {
  const vec = {};
  for (const [term, tf] of Object.entries(termFreqMap)) {
    vec[term] = tf * (idf[term] || 1);
  }
  return vec;
}

/**
 * Retrieve the top-K most relevant chunks for a query within a project.
 * Returns [] (empty) if nothing scores above the minimum threshold --
 * callers must treat that as "insufficient evidence", not "try harder".
 */
async function retrieveRelevantChunks(projectId, queryText, topK = env.retrievalTopK) {
  const chunks = await Chunk.find({ project: projectId }).lean();
  if (chunks.length === 0) return [];

  const idf = await buildIdf(projectId);
  const queryTf = termFrequency(tokenize(queryText));
  const queryVec = toTfIdfVector(queryTf, idf);

  const scored = chunks.map((c) => {
    const chunkTf = {};
    for (const [k, v] of c.termFreq instanceof Map ? c.termFreq.entries() : Object.entries(c.termFreq || {})) {
      chunkTf[k] = v;
    }
    const chunkVec = toTfIdfVector(chunkTf, idf);
    const score = cosineSim(queryVec, chunkVec);
    return { chunk: c, score };
  });

  scored.sort((a, b) => b.score - a.score);

  const top = scored.slice(0, topK).filter((s) => s.score >= env.retrievalMinScore);
  return top.map((s) => ({
    materialId: s.chunk.material,
    materialTitle: s.chunk.materialTitle,
    page: s.chunk.page,
    text: s.chunk.text,
    score: Number(s.score.toFixed(4)),
  }));
}

module.exports = { retrieveRelevantChunks, cosineSim };
