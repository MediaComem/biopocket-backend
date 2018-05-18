const express = require('express');

const api = require('../utils/api');
const auth = require('../utils/auth');
const controller = require('./actions.api');
const policy = require('./actions.policy');

const router = express.Router();

const allowedMethods = {
  '/': [ 'GET' ]
};

router.get('/',
  auth.authorize(policy.canList, { authenticationRequired: false }),
  controller.list);

router.use('/', api.allowsOnlyMethod(allowedMethods['/']));

exports.router = router;
exports.allowedMethods = allowedMethods;
