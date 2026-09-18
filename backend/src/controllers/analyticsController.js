const asyncHandler = require('express-async-handler');
const Event = require('../models/Event');
const Quiz = require('../models/Quiz');
const Mastery = require('../models/Mastery');
const AIUsage = require('../models/AIUsage');
const Project = require('../models/Project');
const Space = require('../models/Space');

const projectAnalytics = asyncHandler(async (req, res) => {
  const projectId = req.project._id;

  const [eventCounts, quizzes, mastery, aiUsage] = await Promise.all([
    Event.aggregate([{ $match: { project: projectId } }, { $group: { _id: '$type', count: { $sum: 1 } } }]),
    Quiz.find({ project: projectId, status: 'completed' }).select('summary completedAt').sort({ completedAt: 1 }).lean(),
    Mastery.find({ project: projectId }).lean(),
    AIUsage.aggregate([
      { $match: { project: projectId } },
      {
        $group: {
          _id: '$feature',
          calls: { $sum: 1 },
          totalTokens: { $sum: '$totalTokens' },
          totalCost: { $sum: '$estimatedCostUsd' },
          avgLatencyMs: { $avg: '$latencyMs' },
          failures: { $sum: { $cond: ['$success', 0, 1] } },
        },
      },
    ]),
  ]);

  res.json({
    activityByType: Object.fromEntries(eventCounts.map((e) => [e._id, e.count])),
    quizPerformanceOverTime: quizzes.map((q) => ({ completedAt: q.completedAt, ...q.summary })),
    conceptTrends: mastery.map((m) => ({ concept: m.conceptName, level: m.level, trend: m.trend, attempts: m.attemptsCount })),
    aiUsageByFeature: aiUsage,
  });
});

const globalAnalytics = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const projects = await Project.find({ user: userId }).select('_id name').lean();
  const projectIds = projects.map((p) => p._id);

  const [mastery, quizzes, events] = await Promise.all([
    Mastery.find({ project: { $in: projectIds } }).lean(),
    Quiz.find({ project: { $in: projectIds }, status: 'completed' }).select('project summary').lean(),
    Event.aggregate([{ $match: { user: userId } }, { $group: { _id: '$type', count: { $sum: 1 } } }]),
  ]);

  const overallProgress = mastery.length
    ? Number((mastery.reduce((s, m) => s + m.level, 0) / mastery.length).toFixed(2))
    : 0;

  res.json({
    spaceCount: await Space.countDocuments({ user: userId }),
    projectCount: projects.length,
    overallProgress,
    quizzesCompleted: quizzes.length,
    activityByType: Object.fromEntries(events.map((e) => [e._id, e.count])),
    projects: projects.map((p) => ({
      id: p._id,
      name: p.name,
      quizzesCompleted: quizzes.filter((q) => q.project.toString() === p._id.toString()).length,
    })),
  });
});

module.exports = { projectAnalytics, globalAnalytics };
