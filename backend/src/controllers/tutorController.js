const asyncHandler = require('express-async-handler');
const { askTutor, getConversation } = require('../services/tutorService');

const ask = asyncHandler(async (req, res) => {
  const { question } = req.validated.body;
  const result = await askTutor({
    userId: req.user._id,
    projectId: req.project._id,
    projectGoal: req.project.goal,
    question,
  });
  res.json(result);
});

const history = asyncHandler(async (req, res) => {
  const convo = await getConversation(req.user._id, req.project._id);
  res.json({ messages: convo.messages, summary: convo.summary });
});

module.exports = { ask, history };
