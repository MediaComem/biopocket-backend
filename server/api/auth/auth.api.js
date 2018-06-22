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
const { authenticationLifespan, credentialsRequired, credentialTypesExclusive } = require('./auth.validations');

// API resource name (used in some API errors).
exports.resourceName = 'auth';

const logger = config.logger(`api:${exports.resourceName}`);

/**
 * **POST /api/auth**
 *
 * Creates a new, short-lived (2 weeks) authentication token for a user.
 * The correct email and password must be provided.
 *
 * @function
 */
exports.authenticate = route(async function(req, res) {

  await validateAuthentication(req);

  // Load the user by email.
  const user = await User.whereEmail(String(req.body.email)).fetch();
  if (!user) {
    throw errors.unauthorized('auth.invalidUser', 'This user account does not exist.');
  } else if (!user.isActive()) {
    throw errors.unauthorized('auth.inactiveUser', 'This user account is inactive.');
  }

  const scope = [];

  // Check the password.
  const password = req.body.password;
  if (password) {
    if (!user.isRegistered()) {
      throw errors.unauthorized('auth.userNotRegistered', 'This user has not completed the registration process.');
    } else if (!_.isString(password) || !await user.checkPassword(password)) {
      throw errors.unauthorized('auth.invalidPassword', 'The password is invalid.');
    }

    // Authenticating with a password generates a JWT with the "api" scope,
    // giving access to everything the user is authorized to do with the API.
    scope.push('api');
  }

  // Check the registration OTP.
  const registrationOtp = req.body.registrationOtp;
  if (registrationOtp) {
    if (user.isRegistered()) {
      throw errors.unauthorized('auth.userAlreadyRegistered', 'This user has already registered.');
    } else if (!_.isString(user.get('registration_otp')) || !user.get('registration_otp_created_at')) {
      throw errors.unauthorized('auth.registrationOtpUnavailable', 'This user has no registration OTP.');
    } else if (!_.isString(registrationOtp) || registrationOtp !== user.get('registration_otp')) {
      throw errors.unauthorized('auth.invalidRegistrationOtp', 'The registration OTP is invalid.');
    } else if (moment().isAfter(moment(user.get('registration_otp_created_at')).add(config.registrationOtpLifespan, 'milliseconds'))) {
      throw errors.unauthorized('auth.expiredRegistrationOtp', 'This registration OTP has expired.');
    }

    // Authenticating with a registration OTP generates a JWT with the "register" scope,
    // which only allows completing the registration process with `PATCH /api/users/:id`.
    scope.push('register');
  }

  req.currentUser = user;
  logger.info(`User ${user.get('api_id')} has logged in`);

  // Determine the expiration date of the JWT based on the user-provided
  // lifespan. If false, it will never expire.
  let exp = false;
  const lifespan = req.body.lifespan;
  if (lifespan === undefined || lifespan === true) {
    exp = moment().add(2, 'weeks').unix();
  } else if (_.isInteger(lifespan)) {
    exp = moment().add(lifespan, 'seconds').unix();
  }

  // Return a new JWT and the user.
  res.status(201).json({
    token: await user.generateJwt({
      exp,
      scope
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
        // An empty string is a valid JSON pointer for the whole document (see
        // https://tools.ietf.org/html/rfc6901#section-5).
        this.json(''),
        credentialsRequired(),
        credentialTypesExclusive()
      ),
      this.validate(
        this.json('/email'),
        this.required(),
        this.type('string'),
        this.email()
      ),
      this.validate(
        this.json('/lifespan'),
        this.while(this.isSet()),
        authenticationLifespan()
      ),
      this.validate(
        this.json('/password'),
        this.while(this.isSet()),
        this.type('string'),
        this.notBlank()
      ),
      this.validate(
        this.json('/registrationOtp'),
        this.while(this.isSet()),
        this.type('string'),
        this.notBlank()
      )
    );
  });
}
