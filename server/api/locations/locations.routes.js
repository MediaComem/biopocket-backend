const express = require('express');

const auth = require('../utils/auth');
const controller = require('./locations.api');
const policy = require('./locations.policy');

const router = express.Router();

// POST /api/locations
router.post('/',
  auth.authorize(policy.canCreate),
  controller.create);

module.exports = router;
