/**
 * Reusable API errors.
 *
 * @module server/api/utils/errors
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
 * @property {object} headers - Headers that should be added to the headers of the response sending back this error.
 */
function ApiError(status, code, message) {

  Error.captureStackTrace(this, this.constructor);

  this.name = this.constructor.name;
  this.status = status;
  this.code = code;
  this.message = message;
  this.headers = {};
}

util.inherits(ApiError, Error);

/**
 * Adds a new property to the `headers` property of the current ApiError object.
 * The `name` and `value` parameters will be used respectivly as this new property's name and value.
 * 
 * @method
 * @memberof ApiError
 * @instance
 * @param {string} name - The name of the header
 * @param {string} value - The value of the header
 * @throws {Error} If no `name` argument is provided or it is not a string
 * @throws {Error} If no `value` argument is provided
 */
ApiError.prototype.header = function(name, value) {
  if (!name || !util.isString(name)) throw new Error('A name argument is required as the first argument to the header method');
  if (!value) throw new Error('A value argument is required as the second argument to the header method');
  this.headers[name] = value;
  return this;
}

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

/**
 * Returns an HTTP 405 Method Not Allowed.
 * 
 * Also adds a new `Allow` header to the returned ApiError (using the `apiError.header()` method) whose value lists the allowed methods given in the `allowedMethods` array.
 * 
 * The message defaults to "The method received in the request-line is known by the origin server but not supported by the target resource."
 * 
 * @param {array} allowedMethods - An array of HTTP methods.
 * @param {string} [code=method.notAllowed] - A code identifying the error.
 * @param {string} [message] - A description of the problem.
 * @returns {ApiError} An API error.
 * @throws {Error} If no `allowedMethods` argument is provided.
 * @throws {TypeError} If the `allowedMethods` argument is not an array.
 * @throws {Error} If the `allowedMethods` array is empty.
 */
exports.methodNotAllowed = function(allowedMethods, code, message) {
  if (!allowedMethods) {
    throw new Error("An allowedMethods argument is required for a methodNotAllowed error");
  } else if (!util.isArray(allowedMethods)) {
    throw new TypeError('The allowedMethods argument must be an array');
  } else if (allowedMethods.length === 0) {
    throw new Error("The allowedMethods argument must contain at least one HTTP method name");
  }
  return new ApiError(405, code || 'method.notAllowed', message || 'The method received in the request-line is known by the origin server but not supported by the target resource.')
    .header('Allow', allowedMethods.join(', '));
}
