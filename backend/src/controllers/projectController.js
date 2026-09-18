const asyncHandler = require('express-async-handler');
const Project = require('../models/Project');
const Material = require('../models/Material');
const Event = require('../models/Event');
const { getProjectMastery } = require('../services/masteryService');
const { getActiveRecommendations } = require('../services/recommendationService');
const { logEvent } = require('../services/eventService');

const createProject = asyncHandler(async (req, res) => {
  const { name, description, goal } = req.validated.body;
  const project = await Project.create({
    user: req.user._id,
    space: req.space._id,
    name,
    description,
    goal,
  });
  await logEvent({ user: req.user._id, project: project._id, space: req.space._id, type: 'project_created', payload: { name } });
  res.status(201).json({ project });
});

const listProjectsForUser = asyncHandler(async (req, res) => {
  const projects = await Project.find({ user: req.user._id }).sort({ updatedAt: -1 }).lean();
  res.json({ projects });
});

/**
 * Project Dashboard (PRD section 4): progress, important concepts, recent
 * activity, performance, and a recommended next step, all in one call so
 * the frontend can render the dashboard without N+1 requests.
 */
const getProjectDashboard = asyncHandler(async (req, res) => {
  const project = req.project;

  const [materials, mastery, recentEvents, recommendations] = await Promise.all([
    Material.find({ project: project._id }).sort({ createdAt: -1 }).lean(),
    getProjectMastery(project._id),
    Event.find({ project: project._id }).sort({ createdAt: -1 }).limit(15).lean(),
    getActiveRecommendations(project._id),
  ]);

  const overallProgress = mastery.length
    ? Number((mastery.reduce((sum, m) => sum + m.level, 0) / mastery.length).toFixed(2))
    : 0;

  const attentionConcepts = mastery.filter((m) => m.trend === 'attention').map((m) => m.conceptName);
  const improvingConcepts = mastery.filter((m) => m.trend === 'improving').map((m) => m.conceptName);

  res.json({
    project,
    materials: materials.map((m) => ({ id: m._id, title: m.title, status: m.status, pageCount: m.pageCount })),
    mastery,
    overallProgress,
    attentionConcepts,
    improvingConcepts,
    recentActivity: recentEvents,
    recommendations,
  });
});

const updateProject = asyncHandler(async (req, res) => {
  const allowed = ['name', 'description', 'goal', 'status'];
  for (const key of allowed) {
    if (req.body[key] !== undefined) req.project[key] = req.body[key];
  }
  await req.project.save();
  res.json({ project: req.project });
});

module.exports = { createProject, listProjectsForUser, getProjectDashboard, updateProject };
