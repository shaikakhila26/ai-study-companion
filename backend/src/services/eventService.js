const Event = require('../models/Event');

/**
 * Central event logger (PRD section 12). Every significant action in the
 * app is recorded here so it can power activity feeds, analytics, and
 * trigger downstream jobs (see jobs/eventReactor.js).
 *
 * Idempotency: pass `dedupeKey` for events that must not be double-counted
 * if a request is retried (e.g. "quiz:<quizId>:completed"). A duplicate key
 * is silently ignored rather than erroring, so retries stay safe.
 */
async function logEvent({ user, project, space, type, payload = {}, dedupeKey = null }) {
  try {
    const event = await Event.create({ user, project, space, type, payload, dedupeKey });
    return event;
  } catch (err) {
    if (err.code === 11000) {
      // Duplicate dedupeKey -- this exact event was already recorded.
      return null;
    }
    throw err;
  }
}

module.exports = { logEvent };
