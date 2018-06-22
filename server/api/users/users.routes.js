const express = require('express');

const api = require('../utils/api');
const auth = require('../utils/auth');
const controller = require('./users.api');
const policy = require('./users.policy');

const router = express.Router();

const allowedMethods = {
  '/': [ 'POST' ],
  '/:id': [ 'GET' ]
};

// POST /api/users
router.post('/',
  auth.authenticate({ authenticationRequired: false }),
  auth.authorize(policy.canCreate, { authenticate: false }),
  controller.create);

// GET /api/users/:id
router.get('/:id',
  auth.authenticate(),
  controller.fetchUser,
  auth.authorize(policy.canRetrieve, { authenticate: false, resourceName: controller.resourceName }),
  controller.retrieve);

// Handles unallowed HTTP method on /api/users/:id
router.use('/:id', api.allowsOnlyMethod(allowedMethods['/:id']));
// Handle unallowed HTTP methods on /
router.use('/', api.allowsOnlyMethod(allowedMethods['/']));

exports.router = router;
exports.allowedMethods = allowedMethods;
