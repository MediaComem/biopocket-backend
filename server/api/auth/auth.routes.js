const express = require('express');

const auth = require('../utils/auth');
const controller = require('./auth.api');
const policy = require('./auth.policy');

const router = express.Router();

// POST /api/auth
router.post('/',
  auth.authorize(policy.canAuthenticate),
  controller.authenticate);

module.exports = router;
