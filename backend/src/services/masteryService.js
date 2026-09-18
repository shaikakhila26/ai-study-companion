const Mastery = require('../models/Mastery');
const Concept = require('../models/Concept');
const { logEvent } = require('./eventService');

/**
 * Mastery update rule (PRD section 10).
 *
 * Explicitly NOT "wrong -> easier, correct -> harder" in isolation. Instead:
 *   - `level` moves toward the evidence via a confidence-weighted blend, so
 *     a single lucky guess barely moves a well-established mastery level,
 *     but repeated evidence in one direction moves it more.
 *   - `confidence` grows with each attempt (more evidence = more certain
 *     estimate) and never resets, distinguishing "we don't know yet" (low
 *     confidence) from "we're confident this is weak" (low level, high
 *     confidence) -- both matter differently for recommendations.
 *   - `trend` is derived from the last few history points, feeding Growth
 *     Analysis (improving / stable / requiring attention).
 *   - `consecutiveMistakes` feeds the repeated-mistake workflow separately
 *     from the smoothed mastery level.
 */

const LEARNING_RATE = 0.35; // how much one new evidence point can move `level`
const CONFIDENCE_STEP = 0.08;

async function applyEvidence({ userId, projectId, conceptName, correctness, source }) {
  // correctness: 0..1 (1 = fully correct/understood, 0 = fully incorrect)
  let concept = await Concept.findOne({ project: projectId, name: conceptName });
  if (!concept) {
    concept = await Concept.create({ user: userId, project: projectId, name: conceptName });
  }

  let mastery = await Mastery.findOne({ project: projectId, concept: concept._id });
  if (!mastery) {
    mastery = await Mastery.create({
      user: userId,
      project: projectId,
      concept: concept._id,
      conceptName: concept.name,
      level: 0.3,
      confidence: 0.15,
    });
  }

  const effectiveLR = LEARNING_RATE * (1 - mastery.confidence * 0.5); // more confident => smaller swings
  const newLevel = mastery.level + effectiveLR * (correctness - mastery.level);

  mastery.level = Math.max(0, Math.min(1, newLevel));
  mastery.confidence = Math.min(1, mastery.confidence + CONFIDENCE_STEP);
  mastery.attemptsCount += 1;
  if (correctness >= 0.6) {
    mastery.correctCount += 1;
    mastery.consecutiveMistakes = 0;
  } else {
    mastery.consecutiveMistakes += 1;
  }
  mastery.lastEvidenceAt = new Date();
  mastery.history.push({ value: mastery.level, reason: source, at: new Date() });
  if (mastery.history.length > 50) mastery.history = mastery.history.slice(-50); // bounded history

  mastery.trend = computeTrend(mastery.history);
  await mastery.save();

  await logEvent({
    user: userId,
    project: projectId,
    type: 'mastery_updated',
    payload: { concept: conceptName, level: mastery.level, trend: mastery.trend, source },
  });

  return { mastery, concept, repeatedMistake: mastery.consecutiveMistakes >= 3 };
}

function computeTrend(history) {
  // Was `< 3` -- with an 8-question quiz cap spread across 5-10 concepts,
  // most concepts only ever accumulate 1-2 evidence points, so almost
  // everything stayed stuck on the 'stable' default and Growth looked
  // static. Two points is enough to show direction; 5 is still the window
  // used once there's more history.
  if (history.length < 2) return 'stable';
  const recent = history.slice(-5);
  const delta = recent[recent.length - 1].value - recent[0].value;
  if (delta > 0.08) return 'improving';
  if (delta < -0.05) return 'attention';
  return 'stable';
}

async function getProjectMastery(projectId) {
  return Mastery.find({ project: projectId }).sort({ conceptName: 1 }).lean();
}

module.exports = { applyEvidence, getProjectMastery, computeTrend };