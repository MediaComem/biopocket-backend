const _ = require('lodash');
const express = require('express');
const glob = require('glob');

const config = require('../../config');
const errors = require('./utils/errors');
const pkg = require('../../package');

const logger = config.logger('api');
const router = express.Router();

// Make sure all models are loaded.
const modelFiles = _.without(glob.sync('*', { cwd: config.path('server', 'models') }), 'abstract.js');
modelFiles.forEach(modelFile => require(`../models/${modelFile}`));

// Plug in API routes.
router.use('/auth', require('./auth/auth.routes'));
router.use('/me', require('./users/users.me.routes'));
router.use('/users', require('./users/users.routes'));

// Return API metadata on the main API route.
router.get('/', function(req, res) {
  res.send({
    version: pkg.version
  });
});

// Catch unknown API routes.
router.all('/*', function(req, res, next) {
  next(errors.notFound());
});

// Return a JSON error response for API calls.
router.use(function(err, req, res, next) {

  const status = err.status || 500;

  // Log the error if unexpected
  if (status >= 500 && status <= 599) {
    logger.error(err);
  }

  let errors;
  if (err.errors) {
    // If the error contains a list of errors, send it in the response.
    errors = err.errors;
  } else if (err.code) {
    // If it's a known error, build a one-element array with the error's properties.
    errors = [
      _.pick(err, 'code', 'message')
    ];
  } else {
    // Otherwise, respond with an unexpected error.
    errors = [
      {
        message: 'An unexpected error occurred'
      }
    ];
  }

  res.status(status).json({
    errors: errors
  });
});

module.exports = router;
