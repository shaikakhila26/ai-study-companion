const express = require('express');
const { protect } = require('../middleware/auth');
const { globalAnalytics } = require('../controllers/analyticsController');

const router = express.Router();
router.get('/', protect, globalAnalytics);
module.exports = router;
