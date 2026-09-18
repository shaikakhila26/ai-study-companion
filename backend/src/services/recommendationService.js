const Mastery = require('../models/Mastery');
const Recommendation = require('../models/Recommendation');
const Project = require('../models/Project');
const { chatComplete } = require('./aiService');
const { logEvent } = require('./eventService');

/**
 * Converts learning evidence (mastery levels, trends, consecutive mistakes)
 * into 1-3 concrete "what should I do next" recommendations (PRD section 10).
 * Runs as a background job after quiz completion / repeated-mistake
 * detection, not on the request path, so it never blocks the user.
 */
async function generateRecommendations({ projectId, trigger }) {
  const project = await Project.findById(projectId).lean();
  if (!project) return [];

  const masteryRecords = await Mastery.find({ project: projectId }).lean();
  if (masteryRecords.length === 0) return [];

  // Supersede prior active recommendations so the user always sees the freshest guidance.
  await Recommendation.updateMany({ project: projectId, status: 'active' }, { $set: { status: 'superseded' } });

  const weakest = [...masteryRecords].sort((a, b) => a.level - b.level).slice(0, 3);
  const attention = masteryRecords.filter((m) => m.trend === 'attention');
  const improving = masteryRecords.filter((m) => m.trend === 'improving');

  const evidenceSummary = masteryRecords
    .map((m) => `- ${m.conceptName}: level ${(m.level * 100).toFixed(0)}%, trend ${m.trend}, consecutive mistakes ${m.consecutiveMistakes}`)
    .join('\n');

  let recommendationTexts = [];
  try {
    const response = await chatComplete({
      feature: 'recommendation',
      project: projectId,
      responseFormat: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content:
            'You generate specific, actionable "what to do next" learning recommendations from mastery ' +
            "evidence. Reference concrete concept names. Respond ONLY with JSON: " +
            '{"recommendations": [string, string, string]} with 1-3 short, specific recommendations ' +
            '(1-2 sentences each), most important first.',
        },
        {
          role: 'user',
          content: `LEARNING GOAL: ${project.goal}\n\nCONCEPT MASTERY EVIDENCE:\n${evidenceSummary}\n\nTRIGGER: ${trigger}`,
        },
      ],
    });
    const parsed = JSON.parse(response.content);
    recommendationTexts = Array.isArray(parsed.recommendations) ? parsed.recommendations : [];
  } catch (err) {
    console.error('[recommendationService] AI generation failed, using rule-based fallback:', err.message);
    recommendationTexts = weakest.map(
      (m) => `Review "${m.conceptName}" (currently ${(m.level * 100).toFixed(0)}% mastery) and try a short assessment.`
    );
  }

  const created = [];
  for (const text of recommendationTexts.slice(0, 3)) {
    const rec = await Recommendation.create({
      user: project.user,
      project: projectId,
      text,
      reasonTags: [
        ...weakest.map((m) => `weak_concept:${m.conceptName}`),
        ...attention.map((m) => `needs_attention:${m.conceptName}`),
        ...improving.map((m) => `improving:${m.conceptName}`),
        `trigger:${trigger}`,
      ],
      relatedConcepts: masteryRecords.map((m) => m.conceptName),
      priority: attention.length > 0 ? 0.8 : 0.5,
    });
    created.push(rec);
  }

  await logEvent({
    user: project.user,
    project: projectId,
    type: 'recommendation_generated',
    payload: { count: created.length, trigger },
  });

  return created;
}

async function getActiveRecommendations(projectId) {
  return Recommendation.find({ project: projectId, status: 'active' }).sort({ priority: -1, createdAt: -1 }).lean();
}

module.exports = { generateRecommendations, getActiveRecommendations };
