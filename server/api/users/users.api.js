/**
 * Users management API.
 *
 * @module server/api/users
 */
const { isObject, isString } = require('lodash');

const config = require('../../../config');
const db = require('../../db');
const { buildEmailOptions } = require('../../emails');
const User = require('../../models/user');
const { ensureRequest } = require('../../utils/express');
const { getLocale } = require('../../utils/i18n');
const { sendMail } = require('../../utils/mailer');
const { fetcher, route, serialize } = require('../utils/api');
const { validateRequestBody } = require('../utils/validation');
const policy = require('./users.policy');
const { emailAvailable } = require('./users.validations');

// API resource name (used in some API errors)
exports.resourceName = 'user';

/**
 * Register a new user.
 *
 * @function
 */
exports.create = route(async function(req, res) {

  // Forget a previous registration attempt with the same email (if old enough).
  if (isObject(req.body)) {
    await forgetOutdatedRegistration(req.body.email);
  }

  await validateUser(req);

  const user = policy.parse(req.body);

  // Hash the password.
  await user.hashAndSetPassword(req.body.password);

  // Generate the OTP that will be sent in the registration link.
  user.generateNewRegistrationOtp();

  // Automatically set the provider information.
  user.set('provider', 'local');
  user.set('provider_id', user.get('email').toLowerCase());

  // Save user & send mail in a transaction.
  // Roll back user creation if the email cannot be sent.
  await db.transaction(async transacting => {
    await user.save(undefined, { transacting });
    await sendRegistrationEmail(req, user);
  });

  // Set the current user so that the user who just registered has enough
  // permissions to see the full serialized representation of himself (see
  // `user.policy.js`).
  if (!req.currentUser || !req.currentUser.hasRole('admin')) {
    req.currentUser = user;
  }

  res.status(201).send(await serialize(req, user, policy));
});

/**
 * Retrieves a single user.
 *
 * @function
 */
exports.retrieve = route(async function(req, res) {
  res.send(await serialize(req, req.user, policy));
});

/**
 * Middleware that fetches the user identified by the ID in the URL.
 *
 * @function
 */
exports.fetchUser = fetcher({
  model: User,
  resourceName: exports.resourceName,
  coerce: id => id.toLowerCase(),
  validate: 'uuid'
});

/**
 * Middleware that attaches the authenticated user to the request in a similar manner to `fetchUser`.
 *
 * @function
 * @param {Request} req - The Express request object.
 * @param {Response} res - The Express response object.
 * @param {function} next - A function to call the next Express middleware.
 */
exports.fetchMe = function(req, res, next) {
  req.user = req.currentUser;
  next();
};

exports.createRegistrationLink = createRegistrationLink;
exports.sendRegistrationEmail = sendRegistrationEmail;

/**
 * Returns a registration link that the user can use to complete the
 * registration process.
 *
 * At the time of writing, there is no web registration page that the link can
 * point to. However, the mobile application should be able to open the link on
 * a phone, and extract the JWT token from it to perform the necessary API
 * operations.
 *
 * @param {User} user - The user to create a registration link for.
 * @returns {Promise<string>} A promise that will be resolved with the registration link.
 */
function createRegistrationLink(user) {
  if (!user.get('registration_otp')) {
    throw new Error(`User "${user.get('api_id')}" has no registration OTP`);
  }

  return config.buildUrl({
    path: '/register',
    query: {
      email: user.get('email'),
      otp: user.get('registration_otp')
    }
  });
}

/**
 * Deletes the previously registered user with the specified email if the
 * registration was made long ago (see `registrationOtpLifespan` in the
 * configuration), and the registration was never completed.
 *
 * @param {string} email - The email used for registration.
 */
async function forgetOutdatedRegistration(email) {
  if (!isString(email)) {
    return;
  }

  const user = await User.whereEmail(email).fetch();
  if (!user || user.isRegistered()) {
    return;
  }

  const registrationOtpCreatedAt = user.get('registration_otp_created_at');
  if (registrationOtpCreatedAt && Date.now() - registrationOtpCreatedAt.getTime() > config.registrationOtpLifespan) {
    await user.destroy();
  }
}

/**
 * Sends a registration email to the specified user.
 *
 * The email will contain a link that the user can use to complete the
 * registration process (see {@link
 * module:server/api/users~createRegistrationLink}).
 *
 * @param {Request} req - An Express request object.
 * @param {User} user - The user to send the email to.
 */
async function sendRegistrationEmail(req, user) {
  ensureRequest(req);

  // TODO: ensure the user actually has an email once we include other providers that might not have it.
  // if (!user.get('email')) {
  //   throw new Error(`User "${user.get('api_id')}" has no email`);
  // }

  await sendMail({
    ...buildEmailOptions('registration', getLocale(req), { link: createRegistrationLink(user) }),
    to: user.get('email')
  });
}

/**
 * Validates the user in the request body.
 *
 * @param {Request} req - An Express request object.
 * @returns {Promise<ValidationErrorBundle>} - A promise that will be resolved if the user is valid, or rejected with a bundle of errors if it is invalid.
 */
function validateUser(req) {
  return validateRequestBody(req, function() {
    return this.parallel(
      this.validate(
        this.json('/firstName'),
        this.required(),
        this.type('string'),
        this.notBlank(),
        this.string(1, 30)
      ),
      this.validate(
        this.json('/lastName'),
        this.required(),
        this.type('string'),
        this.notBlank(),
        this.string(1, 30)
      ),
      this.validate(
        this.json('/email'),
        this.required(),
        this.type('string'),
        this.email(),
        emailAvailable()
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
