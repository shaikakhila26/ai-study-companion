const asyncHandler = require('express-async-handler');
const Project = require('../models/Project');
const Mastery = require('../models/Mastery');
const Recommendation = require('../models/Recommendation');
const Event = require('../models/Event');

/**
 * Home Dashboard (PRD section 16): answers "Where was I, how am I doing,
 * and what should I do next?" in a single call.
 */
const getHome = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const [recentProjects, mastery, recommendations, recentEvents] = await Promise.all([
    Project.find({ user: userId }).sort({ updatedAt: -1 }).limit(5).populate('space', 'name color').lean(),
    Mastery.find({ user: userId }).lean(),
    Recommendation.find({ user: userId, status: 'active' }).sort({ priority: -1, createdAt: -1 }).limit(5).lean(),
    Event.find({ user: userId }).sort({ createdAt: -1 }).limit(10).lean(),
  ]);

  const overallProgress = mastery.length
    ? Number((mastery.reduce((s, m) => s + m.level, 0) / mastery.length).toFixed(2))
    : 0;
  const attentionAreas = mastery.filter((m) => m.trend === 'attention').map((m) => m.conceptName);

  // "Continue Learning" = most recently touched active project.
  const continueLearning = recentProjects.find((p) => p.status === 'active') || null;

  res.json({
    continueLearning,
    recentProjects,
    overallProgress,
    attentionAreas,
    recommendedNextAction: recommendations[0] || null,
    otherRecommendations: recommendations.slice(1),
    recentActivity: recentEvents,
  });
});

module.exports = { getHome };
