const asyncHandler = require('express-async-handler');
const Space = require('../models/Space');
const Project = require('../models/Project');
const { logEvent } = require('../services/eventService');

const listSpaces = asyncHandler(async (req, res) => {
  const spaces = await Space.find({ user: req.user._id }).sort({ createdAt: -1 }).lean();
  const spaceIds = spaces.map((s) => s._id);
  const projectCounts = await Project.aggregate([
    { $match: { space: { $in: spaceIds } } },
    { $group: { _id: '$space', count: { $sum: 1 } } },
  ]);
  const countMap = Object.fromEntries(projectCounts.map((p) => [p._id.toString(), p.count]));
  res.json({ spaces: spaces.map((s) => ({ ...s, projectCount: countMap[s._id.toString()] || 0 })) });
});

const createSpace = asyncHandler(async (req, res) => {
  const { name, description, color, icon } = req.validated.body;
  const space = await Space.create({ user: req.user._id, name, description, color, icon });
  await logEvent({ user: req.user._id, space: space._id, type: 'space_created', payload: { name } });
  res.status(201).json({ space });
});

const getSpace = asyncHandler(async (req, res) => {
  const projects = await Project.find({ space: req.space._id, user: req.user._id }).sort({ createdAt: -1 }).lean();
  res.json({ space: req.space, projects });
});

const deleteSpace = asyncHandler(async (req, res) => {
  const projectCount = await Project.countDocuments({ space: req.space._id });
  if (projectCount > 0) {
    res.status(400);
    throw new Error('Cannot delete a Space that still has Projects. Delete or move its Projects first.');
  }
  await req.space.deleteOne();
  res.json({ success: true });
});

module.exports = { listSpaces, createSpace, getSpace, deleteSpace };
