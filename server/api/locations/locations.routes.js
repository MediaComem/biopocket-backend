const express = require('express');

const auth = require('../utils/auth');
const controller = require('./locations.api');
const policy = require('./locations.policy');

const router = express.Router();

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

module.exports = router;
