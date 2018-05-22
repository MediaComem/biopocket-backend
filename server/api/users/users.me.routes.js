const express = require('express');

const api = require('../utils/api');
const auth = require('../utils/auth');
const controller = require('./users.api');
const policy = require('./users.policy');

const router = express.Router();

const allowedMethods = {
  '/': ['GET']
}

// GET /api/me
router.get('/',
  auth.authenticate(),
  controller.fetchMe,
  auth.authorize(policy.canRetrieve, { authenticate: false }),
  controller.retrieve);

router.use('/', api.allowsOnlyMethod(allowedMethods['/']));

exports.router = router;
exports.allowedMethods = allowedMethods;
