const express = require('express');

const auth = require('../utils/auth');
const controller = require('./users.api');
const policy = require('./users.policy');

const router = express.Router();

// GET /api/users/:id
router.get('/:id',
  auth.authenticate(),
  controller.fetchUser,
  auth.authorize(policy.canRetrieve, { authenticate: false, resourceName: controller.resourceName }),
  controller.retrieve);

module.exports = router;
