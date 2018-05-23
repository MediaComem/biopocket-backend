const express = require('express');

const api = require('../utils/api');
const auth = require('../utils/auth');
const controller = require('./locations.api');
const policy = require('./locations.policy');

const router = express.Router();

const allowedMethods = {
  '/': [ 'GET', 'POST' ],
  '/:id': [ 'GET', 'PATCH', 'DELETE' ]
};

// POST /api/locations
router.post('/',
  auth.authorize(policy.canCreate),
  controller.create);

// GET /api/locations
router.get('/',
  auth.authorize(policy.canList, { authenticationRequired: false }),
  controller.list);

// GET /api/locations/:id
router.get('/:id',
  controller.fetchLocation,
  auth.authorize(policy.canRetrieve, { authenticationRequired: false }),
  controller.retrieve);

// PATCH /api/locations/:id
router.patch('/:id',
  controller.fetchLocation,
  auth.authorize(policy.canUpdate),
  controller.update);

// DELETE /api/locations/:id
router.delete('/:id',
  controller.fetchLocation,
  auth.authorize(policy.canDestroy),
  controller.destroy);

// Handle unallowed HTTP methids on /:id
router.use('/:id', api.allowsOnlyMethod(allowedMethods['/:id']));
// Handle unallowed HTTP methods on /
router.use('/', api.allowsOnlyMethod(allowedMethods['/']));

exports.router = router;
exports.allowedMethods = allowedMethods;
