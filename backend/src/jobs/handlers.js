const { registerHandler, enqueue } = require('./queue');
const { processMaterial } = require('../services/materialProcessorService');
const { generateRecommendations } = require('../services/recommendationService');
const { logEvent } = require('../services/eventService');

/**
 * Wires each Job `type` to its handler. Called once at server startup.
 * See PRD section 13 (Intelligent Background Workflows) for the three
 * workflows implemented here: material processing, post-quiz learning
 * updates (evaluation happens synchronously in quizService for immediate
 * feedback; this queue picks up *after* completion), and repeated-mistake
 * detection.
 */
function registerJobHandlers() {
  registerHandler('process_material', async (payload) => {
    await processMaterial(payload.materialId);
  });

  registerHandler('generate_recommendation', async (payload) => {
    await generateRecommendations({ projectId: payload.projectId, trigger: payload.trigger });
  });

  registerHandler('detect_repeated_mistake', async (payload) => {
    await logEvent({
      user: payload.userId,
      project: payload.projectId,
      type: 'repeated_mistake_detected',
      payload: { conceptName: payload.conceptName },
    });
    // Feed straight into a targeted recommendation pass.
    await enqueue(
      'generate_recommendation',
      { userId: payload.userId, projectId: payload.projectId, trigger: `repeated_mistake:${payload.conceptName}` },
      { idempotencyKey: `recommend:repeated_mistake:${payload.projectId}:${payload.conceptName}:${Date.now()}` }
    );
  });
}

module.exports = { registerJobHandlers };
