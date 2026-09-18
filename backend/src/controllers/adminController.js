const asyncHandler = require('express-async-handler');
const mongoose = require('mongoose');
const User = require('../models/User');
const Space = require('../models/Space');
const Project = require('../models/Project');
const Event = require('../models/Event');
const AIUsage = require('../models/AIUsage');
const Job = require('../models/Job');
const Quiz = require('../models/Quiz');
const Mastery = require('../models/Mastery');
const Material = require('../models/Material');

/**
 * Platform-level overview (PRD section 16: Admin Dashboard). Intentionally
 * a lightweight operational/product-analytics view, not a replacement for
 * dedicated infra monitoring (e.g. no log aggregation or alerting here).
 */
const overview = asyncHandler(async (req, res) => {
  const [userCount, spaceCount, projectCount, materialCount, quizCount, jobStats, aiStats, dbState] =
    await Promise.all([
      User.countDocuments(),
      Space.countDocuments(),
      Project.countDocuments(),
      Material.countDocuments(),
      Quiz.countDocuments({ status: 'completed' }),
      Job.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
      AIUsage.aggregate([
        {
          $group: {
            _id: null,
            totalCalls: { $sum: 1 },
            totalTokens: { $sum: '$totalTokens' },
            totalCost: { $sum: '$estimatedCostUsd' },
            failures: { $sum: { $cond: ['$success', 0, 1] } },
            avgLatencyMs: { $avg: '$latencyMs' },
          },
        },
      ]),
      Promise.resolve(mongoose.connection.readyState), // 1 = connected
    ]);

  res.json({
    counts: { users: userCount, spaces: spaceCount, projects: projectCount, materials: materialCount, completedQuizzes: quizCount },
    jobStatus: Object.fromEntries(jobStats.map((j) => [j._id, j.count])),
    aiUsage: aiStats[0] || { totalCalls: 0, totalTokens: 0, totalCost: 0, failures: 0, avgLatencyMs: 0 },
    systemHealth: { database: dbState === 1 ? 'connected' : 'disconnected' },
  });
});

const listUsers = asyncHandler(async (req, res) => {
  const users = await User.find().select('-passwordHash').sort({ createdAt: -1 }).lean();
  const projectCounts = await Project.aggregate([{ $group: { _id: '$user', count: { $sum: 1 } } }]);
  const map = Object.fromEntries(projectCounts.map((p) => [p._id.toString(), p.count]));
  res.json({ users: users.map((u) => ({ ...u, projectCount: map[u._id.toString()] || 0 })) });
});

/**
 * Deep-dive into a single user's learning journey: Projects, activity,
 * assessments, progress, AI usage -- as required by PRD section 16.
 */
const getUserDetail = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.userId).select('-passwordHash').lean();
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }
  const projects = await Project.find({ user: user._id }).lean();
  const projectIds = projects.map((p) => p._id);

  const [events, quizzes, mastery, aiUsage] = await Promise.all([
    Event.find({ user: user._id }).sort({ createdAt: -1 }).limit(50).lean(),
    Quiz.find({ user: user._id }).select('project status summary completedAt').lean(),
    Mastery.find({ project: { $in: projectIds } }).lean(),
    AIUsage.aggregate([
      { $match: { user: user._id } },
      { $group: { _id: '$feature', calls: { $sum: 1 }, totalCost: { $sum: '$estimatedCostUsd' } } },
    ]),
  ]);

  res.json({ user, projects, recentActivity: events, quizzes, mastery, aiUsage });
});

/**
 * Platform-wide activity feed, filterable by user/space/project/type/time
 * (PRD section 16).
 */
const activityFeed = asyncHandler(async (req, res) => {
  const { userId, spaceId, projectId, type, from, to, limit } = req.query;
  const filter = {};
  if (userId) filter.user = userId;
  if (spaceId) filter.space = spaceId;
  if (projectId) filter.project = projectId;
  if (type) filter.type = type;
  if (from || to) {
    filter.createdAt = {};
    if (from) filter.createdAt.$gte = new Date(from);
    if (to) filter.createdAt.$lte = new Date(to);
  }

  const events = await Event.find(filter)
    .sort({ createdAt: -1 })
    .limit(Math.min(parseInt(limit, 10) || 100, 500))
    .lean();
  res.json({ events });
});

const aiUsageDetail = asyncHandler(async (req, res) => {
  const byFeature = await AIUsage.aggregate([
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
    { $sort: { calls: -1 } },
  ]);
  const recentFailures = await AIUsage.find({ success: false }).sort({ createdAt: -1 }).limit(20).lean();
  res.json({ byFeature, recentFailures });
});

const jobStatus = asyncHandler(async (req, res) => {
  const jobs = await Job.find().sort({ updatedAt: -1 }).limit(100).lean();
  const summary = await Job.aggregate([{ $group: { _id: { type: '$type', status: '$status' }, count: { $sum: 1 } } }]);
  res.json({ recentJobs: jobs, summary });
});

module.exports = { overview, listUsers, getUserDetail, activityFeed, aiUsageDetail, jobStatus };
