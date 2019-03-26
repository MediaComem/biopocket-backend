const express = require('express');
const glob = require('glob');
const _ = require('lodash');

const config = require('../../config');
const pkg = require('../../package');
const errors = require('./utils/errors');
const validation = require('./utils/validation');

const logger = config.logger('api');
const router = express.Router();

// Make sure all models are loaded.
const modelFiles = _.without(glob.sync('*', { cwd: config.path('server', 'models') }), 'abstract.js').filter(file => !file.match(/\.spec\.js$/));
modelFiles.forEach(modelFile => require(`../models/${modelFile}`));

// Ensures that if an `include` query parameter is present and is an array, it contains no duplicate value.
router.use((res, req, next) => {
  if (req.query && _.isArray(req.query.include)) {
    req.query.include = _.uniq(req.query.include);
  }
  next();
});

// Plug in API routes.
router.use('/actions', require('./actions/actions.routes').router);
router.use('/auth', require('./auth/auth.routes').router);
router.use('/locations', require('./locations/locations.routes').router);
router.use('/me', require('./users/users.me.routes').router);
router.use('/registrations', require('./registrations/registrations.routes').router);
router.use('/themes', require('./themes/themes.routes').router);
router.use('/users', require('./users/users.routes').router);

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

  // Sets the headers if the received error has some
  if (err.headers) {
    _.each(err.headers, (value, name) => res.set(name, value));
  }

  let responseErrors;
  if (err instanceof validation.dsl.ValidationErrorBundle) {
    // If the error contains a list of errors, send it in the response.
    responseErrors = err.errors;
  } else if (err.code) {
    // If it's a known error, build a one-element array with the error's properties.
    responseErrors = [
      _.pick(err, 'code', 'message')
    ];
  } else {
    // Otherwise, respond with an unexpected error.
    responseErrors = [
      {
        message: 'An unexpected error occurred'
      }
    ];
  }

  res.status(status).json({
    errors: responseErrors
  });
});

module.exports = router;
