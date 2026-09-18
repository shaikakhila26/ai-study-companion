const asyncHandler = require('express-async-handler');
const Quiz = require('../models/Quiz');
const quizService = require('../services/quizService');

const start = asyncHandler(async (req, res) => {
  const { quiz, question } = await quizService.startQuiz({ userId: req.user._id, projectId: req.project._id });
  res.status(201).json({ quizId: quiz._id, question, questionNumber: quiz.questions.length });
});

async function loadOwnedQuiz(req, res) {
  const quiz = await Quiz.findOne({ _id: req.params.quizId, user: req.user._id });
  if (!quiz) {
    res.status(404);
    throw new Error('Quiz not found');
  }
  return quiz;
}

const answer = asyncHandler(async (req, res) => {
  const quiz = await loadOwnedQuiz(req, res);
  if (quiz.status !== 'in_progress') {
    res.status(400);
    throw new Error('This quiz has already been completed');
  }
  const { questionId, answer: userAnswer } = req.validated.body;
  const question = await quizService.submitAnswer({ quiz, questionId, answer: userAnswer });
  res.json({ question });
});

const next = asyncHandler(async (req, res) => {
  const quiz = await loadOwnedQuiz(req, res);
  if (quiz.status !== 'in_progress') {
    res.status(400);
    throw new Error('This quiz has already been completed');
  }
  // Cap quiz length for a sane prototype session.
  if (quiz.questions.length >= 8) {
    const completed = await quizService.completeQuiz(quiz);
    res.json({ done: true, quiz: completed });
    return;
  }
  const question = await quizService.addNextQuestion(quiz);
  res.json({ done: false, question, questionNumber: quiz.questions.length });
});

const complete = asyncHandler(async (req, res) => {
  const quiz = await loadOwnedQuiz(req, res);
  const completed = await quizService.completeQuiz(quiz);
  res.json({ quiz: completed });
});

const get = asyncHandler(async (req, res) => {
  const quiz = await loadOwnedQuiz(req, res);
  res.json({ quiz });
});

module.exports = { start, answer, next, complete, get };
