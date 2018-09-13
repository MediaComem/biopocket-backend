const express = require('express');

const api = require('../utils/api');
const auth = require('../utils/auth');
const controller = require('./registrations.api');
const policy = require('./registrations.policy');

const router = express.Router();

const allowedMethods = {
  '/': [ 'POST' ]
};

router.post('/',
  auth.authorize(policy.canCreate, { authenticationRequired: false }),
  controller.create);

router.use('/', api.allowsOnlyMethod(allowedMethods['/']));

exports.router = router;
exports.allowedMethods = allowedMethods;
