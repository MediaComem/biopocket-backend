const express = require('express');

const auth = require('../utils/auth');
const controller = require('./users.api');
const policy = require('./users.policy');

const router = express.Router();

// GET /api/me
router.get('/',
  auth.authenticate(),
  controller.fetchMe,
  auth.authorize(policy.canRetrieve, { authenticate: false }),
  controller.retrieve);

module.exports = router;
