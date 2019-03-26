/**
 * Registrations management API.
 *
 * @module server/api/registrations
 */
const Registration = require('../../models/registration');
const { fetcher, route, serialize } = require('../utils/api');
const { validateRequestBody } = require('../utils/validation');
const policy = require('./registrations.policy');

// API resource name (used in some API errors)
exports.resourceName = 'registration';

/**
 * Creates a new registration.
 *
 * @function
 */
exports.create = route(async (req, res) => {

  await validateCreateRequest(req);

  const registration = policy.parse(req.body);
  await registration.save();

  res.status(201).send(await serialize(req, registration, policy));
});

exports.remove = route(async (req, res) => {
  await req.registration.destroy();

  res.sendStatus(204);
});

/**
 * Checks if a registration with a specific email exists.
 *
 * @function
 */
exports.checkExistence = route((req, res) => res.sendStatus(200));

/**
 * Middleware that fetches the registration associated with the email in the URL.
 *
 * @function
 */
exports.fetchRegistrationByEmail = fetcher({
  column: 'email',
  urlParameter: 'email',
  model: Registration,
  resourceName: exports.resourceName,
  coerce: email => email.toLowerCase()
});

/**
 * Validates the post parameters of a request to create a registration.
 * @param {Request} req An Express request.
 * @returns {Promise<ValidationErrorBundle>} A promise that will be resolved if the request is valid, or rejected with a bundle of errors if it is invalid.
 */
function validateCreateRequest(req) {
  return validateRequestBody(req, function() {
    return this.parallel(
      this.validate(
        this.json('/firstname'),
        this.required(),
        this.type('string'),
        this.notBlank(),
        this.string(1, 255)
      ),
      this.validate(
        this.json('/lastname'),
        this.required(),
        this.type('string'),
        this.notBlank(),
        this.string(1, 255)
      ),
      this.validate(
        this.json('/email'),
        this.required(),
        this.type('string'),
        this.notBlank(),
        this.string(1, 255)
      )
    );
  });
}
