const Job = require('../models/Job');
const env = require('../config/env');

/**
 * In-process async job queue.
 *
 * The PRD asks for background processing "where appropriate" and calls out
 * retries, duplicate-job handling, and recovery. A dedicated broker
 * (BullMQ+Redis, SQS, etc.) is the production answer, but for a 3-4 day
 * prototype deployed as a single Node process, this in-process queue backed
 * by the `Job` Mongo collection gives the same *behavioral* guarantees
 * (persisted state, idempotency, retry/backoff, recoverable on restart)
 * without an extra infrastructure dependency. See docs/ARCHITECTURE.md for
 * the tradeoff and how to swap in BullMQ later.
 */

const handlers = {}; // type -> async (payload) => void

function registerHandler(type, handler) {
  handlers[type] = handler;
}

async function enqueue(type, payload, { idempotencyKey = null, maxAttempts } = {}) {
  try {
    const job = await Job.create({
      type,
      payload,
      idempotencyKey,
      maxAttempts: maxAttempts ?? env.jobMaxRetries,
    });
    return job;
  } catch (err) {
    if (err.code === 11000) {
      // A job with this idempotencyKey already exists -- don't duplicate work.
      return Job.findOne({ idempotencyKey });
    }
    throw err;
  }
}

function backoffMs(attempt) {
  return Math.min(30000, 500 * 2 ** attempt); // capped exponential backoff
}

async function processOne() {
  const job = await Job.findOneAndUpdate(
    { status: 'queued', runAfter: { $lte: new Date() } },
    { $set: { status: 'processing' }, $inc: { attempts: 1 } },
    { sort: { createdAt: 1 }, new: true }
  );
  if (!job) return false;

  const handler = handlers[job.type];
  if (!handler) {
    job.status = 'failed';
    job.lastError = `No handler registered for job type "${job.type}"`;
    await job.save();
    return true;
  }

  try {
    await handler(job.payload);
    job.status = 'completed';
    job.completedAt = new Date();
    await job.save();
  } catch (err) {
    if (job.attempts >= job.maxAttempts) {
      job.status = 'failed';
      job.lastError = err.message;
      await job.save();
    } else {
      job.status = 'queued';
      job.lastError = err.message;
      job.runAfter = new Date(Date.now() + backoffMs(job.attempts));
      await job.save();
    }
  }
  return true;
}

let workerHandle = null;

function startWorker() {
  if (workerHandle) return;
  workerHandle = setInterval(async () => {
    try {
      // Drain a small batch each tick so one slow job doesn't starve others.
      for (let i = 0; i < 5; i++) {
        const didWork = await processOne();
        if (!didWork) break;
      }
    } catch (err) {
      console.error('[jobQueue] worker tick error:', err.message);
    }
  }, env.jobPollIntervalMs);
  console.log('[jobQueue] worker started');
}

function stopWorker() {
  if (workerHandle) clearInterval(workerHandle);
  workerHandle = null;
}

module.exports = { registerHandler, enqueue, startWorker, stopWorker, processOne };
