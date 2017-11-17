const config = require('../../config');
const util = require('util');

function ApiError(status, code, message) {
  Error.captureStackTrace(this, this.constructor);
  this.name = this.constructor.name;
  this.status = status;
  this.code = code;
  this.message = message;
}

util.inherits(ApiError, Error);

exports.ApiError = ApiError;

// HTTP 401 Unauthorized

exports.unauthorized = function(code, message) {
  return new ApiError(401, code, message || 'Authentication is required to access this resource. Authenticate by providing a Bearer token in the Authorization header.');
};

exports.missingAuthorization = function() {
  return exports.unauthorized('auth.missingAuthorization');
};

exports.malformedAuthorization = function() {
  return exports.unauthorized('auth.malformedAuthorization', 'The Authorization header is not in the correct format. It should be "Authorization: Bearer TOKEN".');
};

exports.invalidAuthorization = function() {
  return exports.unauthorized('auth.invalidAuthorization', 'The Bearer token supplied in the Authorization header is invalid or has expired.');
};

// HTTP 403 Forbidden

exports.forbidden = function(code, message) {
  return new ApiError(403, code || 'auth.forbidden', message || 'You are not authorized to access this resource. Authenticate with a user account that has more privileges.');
};

// HTTP 404 Not Found

exports.notFound = function(code, message) {
  return new ApiError(404, code || 'resource.notFound', message || 'No resource was found at this verb and URI.');
};

exports.recordNotFound = function(name, id) {
  return exports.notFound('record.notFound', 'No ' + name + ' was found with ID ' + id + '.');
};
