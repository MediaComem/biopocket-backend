const express = require('express');

const api = require('../utils/api');
const auth = require('../utils/auth');
const controller = require('./auth.api');
const policy = require('./auth.policy');

const router = express.Router();

const allowedMethods = {
  '/': [ 'POST' ]
};

// POST /api/auth
router.post('/',
  auth.authorize(policy.canAuthenticate, { authenticate: false }),
  controller.authenticate);

// Handles unallowed HTTP methods on /
router.use('/', api.allowsOnlyMethod(allowedMethods['/']));

exports.router = router;
exports.allowedMethods = allowedMethods;
