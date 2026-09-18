const express = require('express');
const { register, login, me } = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const v = require('../utils/validators');

const router = express.Router();

router.post('/register', validate(v.register), register);
router.post('/login', validate(v.login), login);
router.get('/me', protect, me);

module.exports = router;
