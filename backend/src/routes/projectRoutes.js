const express = require('express');
const { protect } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { ownsResource } = require('../middleware/ownership');
const Project = require('../models/Project');
const projectCtrl = require('../controllers/projectController');
const materialCtrl = require('../controllers/materialController');
const tutorCtrl = require('../controllers/tutorController');
const quizCtrl = require('../controllers/quizController');
const growthCtrl = require('../controllers/growthController');
const analyticsCtrl = require('../controllers/analyticsController');
const recommendationCtrl = require('../controllers/recommendationController');
const v = require('../utils/validators');
const upload = require('../middleware/upload');

const router = express.Router();
router.use(protect);

const loadProject = ownsResource(Project, 'projectId', 'project');

router.get('/', projectCtrl.listProjectsForUser);
router.get('/:projectId', loadProject, projectCtrl.getProjectDashboard);
router.patch('/:projectId', loadProject, projectCtrl.updateProject);

// Materials
router.post('/:projectId/materials', loadProject, upload.single('file'), materialCtrl.uploadMaterial);
router.get('/:projectId/materials', loadProject, materialCtrl.listMaterials);
router.get('/:projectId/materials/:materialId', loadProject, materialCtrl.getMaterialStatus);

// Tutor
router.post('/:projectId/tutor/ask', loadProject, validate(v.askTutor), tutorCtrl.ask);
router.get('/:projectId/tutor/history', loadProject, tutorCtrl.history);

// Quiz (starting a quiz is project-scoped; subsequent actions use /api/quiz/:quizId)
router.post('/:projectId/quiz/start', loadProject, quizCtrl.start);

// Growth & Analytics
router.get('/:projectId/growth', loadProject, growthCtrl.getGrowth);
router.get('/:projectId/analytics', loadProject, analyticsCtrl.projectAnalytics);

// Recommendations
router.get('/:projectId/recommendations', loadProject, recommendationCtrl.list);
router.patch('/:projectId/recommendations/:recId', loadProject, recommendationCtrl.updateStatus);

module.exports = router;
