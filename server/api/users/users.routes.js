const express = require('express');

const api = require('../utils/api');
const auth = require('../utils/auth');
const controller = require('./users.api');
const policy = require('./users.policy');

const router = express.Router();

const allowedMethods = {
  '/:id': [ 'GET' ]
}

// GET /api/users/:id
router.get('/:id',
  auth.authenticate(),
  controller.fetchUser,
  auth.authorize(policy.canRetrieve, { authenticate: false, resourceName: controller.resourceName }),
  controller.retrieve);

// Handles unallowed HTTP method on /api/users/:id
router.use('/:id', api.allowsOnlyMethod(allowedMethods['/:id']));

exports.router = router;
exports.allowedMethods = allowedMethods;
