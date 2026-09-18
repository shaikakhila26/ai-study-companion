const asyncHandler = require('express-async-handler');
const Recommendation = require('../models/Recommendation');
const { getActiveRecommendations } = require('../services/recommendationService');

const list = asyncHandler(async (req, res) => {
  const recommendations = await getActiveRecommendations(req.project._id);
  res.json({ recommendations });
});

const updateStatus = asyncHandler(async (req, res) => {
  const rec = await Recommendation.findOne({ _id: req.params.recId, project: req.project._id, user: req.user._id });
  if (!rec) {
    res.status(404);
    throw new Error('Recommendation not found');
  }
  const { status } = req.body;
  if (!['dismissed', 'completed'].includes(status)) {
    res.status(400);
    throw new Error('status must be "dismissed" or "completed"');
  }
  rec.status = status;
  await rec.save();
  res.json({ recommendation: rec });
});

module.exports = { list, updateStatus };
