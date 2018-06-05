const express = require('express');

const api = require('../utils/api');
const auth = require('../utils/auth');
const controller = require('./themes.api');
const policy = require('./themes.policy');

const router = express.Router();

const allowedMethods = {
  '/:id': [ 'GET' ]
};

router.get('/:id',
  controller.fetchTheme,
  auth.authorize(policy.canRetrieve, { authenticationRequired: false }),
  controller.retrieve);

router.use('/:id', api.allowsOnlyMethod(allowedMethods['/:id']));

exports.router = router;
exports.allowedMethods = allowedMethods;
