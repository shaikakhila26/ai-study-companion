const express = require('express');
const { protect } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { ownsResource } = require('../middleware/ownership');
const Space = require('../models/Space');
const spaceCtrl = require('../controllers/spaceController');
const projectCtrl = require('../controllers/projectController');
const v = require('../utils/validators');

const router = express.Router();
router.use(protect);

router.get('/', spaceCtrl.listSpaces);
router.post('/', validate(v.createSpace), spaceCtrl.createSpace);
router.get('/:id', ownsResource(Space, 'id', 'space'), spaceCtrl.getSpace);
router.delete('/:id', ownsResource(Space, 'id', 'space'), spaceCtrl.deleteSpace);

// Nested: create a Project inside a Space
router.post(
  '/:spaceId/projects',
  ownsResource(Space, 'spaceId', 'space'),
  validate(v.createProject),
  projectCtrl.createProject
);

module.exports = router;
