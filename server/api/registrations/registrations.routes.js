const express = require('express');

const api = require('../utils/api');
const auth = require('../utils/auth');
const controller = require('./registrations.api');
const policy = require('./registrations.policy');

const router = express.Router();

const allowedMethods = {
  '/': [ 'POST' ],
  '/:email': [ 'HEAD', 'DELETE' ]
};

router.post('/',
  auth.authorize(policy.canCreate, { authenticationRequired: false }),
  controller.create);

router.head('/:email',
  controller.fetchRegistrationByEmail,
  auth.authorize(policy.canRetrieveByEmail, { authenticationRequired: false }),
  controller.checkExistence);

router.delete('/:email',
  controller.fetchRegistrationByEmail,
  auth.authorize(policy.canRemove, { authenticationRequired: false }),
  controller.remove);

router.use('/:email', api.allowsOnlyMethod(allowedMethods['/:email']));
router.use('/', api.allowsOnlyMethod(allowedMethods['/']));

exports.router = router;
exports.allowedMethods = allowedMethods;
