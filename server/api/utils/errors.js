/**
 * Reusable API errors.
 *
 * @module api/utils/errors
 */
const util = require('util');

/**
 * An API error.
 *
 * When thrown from an API route or middleware, an error of this type will
 * automatically be serialized as JSON and the HTTP response will have the
 * correct status code.
 *
 * @class
 * @extends Error
 * @property {string} name - The type of error.
 * @property {number} status - The HTTP status code to respond with when this error occurs.
 * @property {string} code - A code identifying the error (e.g. `category.whatWentWrong`).
 * @property {string} message - A description of the problem.
 */
function ApiError(status, code, message) {

  Error.captureStackTrace(this, this.constructor);

  this.name = this.constructor.name;
  this.status = status;
  this.code = code;
  this.message = message;
}

util.inherits(ApiError, Error);

exports.ApiError = ApiError;

/**
 * Returns an HTTP 401 Unauthorized error.
 *
 * @param {string} code - A code identifying the error (e.g. `auth.whatWentWrong`).
 *
 * @param {string} message - A description of the problem.
 *
 * @returns {ApiError} An API error.
 */
exports.unauthorized = function(code, message) {
  return new ApiError(401, code, message || 'Authentication is required to access this resource. Authenticate by providing a Bearer token in the Authorization header.');
};

/**
 * Returns an HTTP 401 Unauthorized error with the `auth.missingAuthorization` code due to missing credentials.
 * @returns {ApiError} An API error.
 */
exports.missingAuthorization = function() {
  return exports.unauthorized('auth.missingAuthorization');
};

/**
 * Returns an HTTP 401 Unauthorized error with the `auth.malformedAuthorization` code due to malformed credentials (e.g. a badly formatted Authorization header).
 * @returns {ApiError} An API error.
 */
exports.malformedAuthorization = function() {
  return exports.unauthorized('auth.malformedAuthorization', 'The Authorization header is not in the correct format. It should be "Authorization: Bearer TOKEN".');
};

/**
 * Returns an HTTP 401 Unauthorized error with the `auth.invalidAuthorization` code due to invalid credentials (e.g. an expired JWT).
 * @returns {ApiError} An API error.
 */
exports.invalidAuthorization = function() {
  return exports.unauthorized('auth.invalidAuthorization', 'The Bearer token supplied in the Authorization header is invalid or has expired.');
};

/**
 * Returns an HTTP 403 Forbidden error.
 *
 * The message defaults to "You are not authorized to access this resource. Authenticate with a user account that has more privileges.".
 *
 * @param {string} [code=auth.forbidden] - A code identifying the error.
 *
 * @param {string} [message] - A description of the problem.
 *
 * @returns {ApiError} An API error.
 */
exports.forbidden = function(code, message) {
  return new ApiError(403, code || 'auth.forbidden', message || 'You are not authorized to access this resource. Authenticate with a user account that has more privileges.');
};

/**
 * Returns an HTTP 404 Not Found error.
 *
 * The message defaults to "No resource was found at this verb and URI.".
 *
 * @param {string} [code=resource.notFound] - A code identifying the error.
 *
 * @param {string} [message] - A description of the problem.
 *
 * @returns {ApiError} An API error.
 */
exports.notFound = function(code, message) {
  return new ApiError(404, code || 'resource.notFound', message || 'No resource was found at this verb and URI.');
};

/**
 * Returns an HTTP 404 Not Found error due to a missing resource.
 * @returns {ApiError} An API error.
 */
exports.recordNotFound = function(name, id) {
  return exports.notFound('record.notFound', 'No ' + name + ' was found with ID ' + id + '.');
};
