/**
 * Authentication API.
 *
 * @module server/api/auth
 */
const _ = require('lodash');
const moment = require('moment');

const config = require('../../../config');
const User = require('../../models/user');
const usersPolicy = require('../users/users.policy');
const { route } = require('../utils/api');
const errors = require('../utils/errors');
const { validateRequestBody } = require('../utils/validation');

// API resource name (used in some API errors).
exports.resourceName = 'auth';

const logger = config.logger(`api:${exports.resourceName}`);

/**
 * **POST /api/auth**
 *
 * Creates a new, short-lived (2 weeks) authentication token for a user.
 * The correct e-mail and password must be provided.
 *
 * @function
 */
exports.authenticate = route(async function(req, res) {

  await validateAuthentication(req);

  // Load the user by e-mail.
  const email = _.get(req, 'body.email', '_').toString();
  const user = await new User({ email: email.toLowerCase() }).fetch();
  if (!user || !user.isActive()) {
    throw errors.unauthorized('auth.invalidUser', 'This user account does not exist or is inactive.');
  }

  // Check the password.
  const password = req.body.password;
  if (!_.isString(password) || !user.hasPassword(password)) {
    throw errors.unauthorized('auth.invalidCredentials', 'The password is invalid.');
  }

  req.currentUser = user;
  logger.info(`User ${user.get('api_id')} has logged in`);

  // Return a new JWT and the user.
  res.status(201).json({
    token: user.generateJwt({
      exp: moment().add(2, 'weeks').unix()
    }),
    user: usersPolicy.serialize(req, user)
  });
});

/**
 * Validates the authentication request in the request body.
 *
 * @param {Request} req - An Express request object.
 * @returns {Promise<ValidationErrorBundle>} - A promise that will be resolved if the request is valid, or rejected with a bundle of errors if it is invalid.
 */
function validateAuthentication(req) {
  return validateRequestBody(req, function() {
    return this.parallel(
      this.validate(
        this.json('/email'),
        this.required(),
        this.type('string'),
        this.email()
      ),
      this.validate(
        this.json('/password'),
        this.required(),
        this.type('string'),
        this.notBlank()
      )
    );
  });
}
