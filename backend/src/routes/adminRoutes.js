const express = require('express');
const { protect, requireAdmin } = require('../middleware/auth');
const admin = require('../controllers/adminController');

const router = express.Router();
router.use(protect, requireAdmin);

router.get('/overview', admin.overview);
router.get('/users', admin.listUsers);
router.get('/users/:userId', admin.getUserDetail);
router.get('/activity', admin.activityFeed);
router.get('/ai-usage', admin.aiUsageDetail);
router.get('/jobs', admin.jobStatus);

module.exports = router;
