const express = require('express');

const auth = require('../utils/auth');
const controller = require('./users.api');
const policy = require('./users.policy');

const router = express.Router();

// GET /api/users/:id
router.get('/:id',
  controller.fetchUser,
  auth.authorize(policy.canRetrieve, controller.resourceName),
  controller.retrieve);

module.exports = router;
