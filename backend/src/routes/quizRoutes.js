const express = require('express');
const { protect } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const quizCtrl = require('../controllers/quizController');
const v = require('../utils/validators');

const router = express.Router();
router.use(protect);

router.get('/:quizId', quizCtrl.get);
router.post('/:quizId/answer', validate(v.submitAnswer), quizCtrl.answer);
router.post('/:quizId/next', quizCtrl.next);
router.post('/:quizId/complete', quizCtrl.complete);

module.exports = router;
