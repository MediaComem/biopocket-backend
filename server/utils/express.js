/**
 * Express-related utilities.
 *
 * @module server/utils/express
 */
const config = require('../../config');
const log4js = require('log4js');

const logger = config.logger('express');

/**
 * Ensures that the specified object is an Express request, or throws an error.
 *
 * @param {Request} req - An Express request object.
 * @param {string} description - An optional description of where the object comes from (e.g. first argument).
 * @returns {Request} The first argument, unchanged.
 */
exports.ensureRequest = function(req, description = 'Argument') {
  if (!exports.isRequest(req)) {
    throw new Error(`${description} must be an Express request`);
  }

  return req;
};

/**
 * Indicates whether the specified object is an Express request object.
 *
 * @param {*} req - The object to check.
 * @returns {boolean} True if the object looks like an Express request, false otherwise.
 */
exports.isRequest = function(req) {
  return req && req.app && typeof(req.method) === 'string' && typeof(req.path) === 'string';
};

/**
 * Indicates whether the specified object is an Express response object.
 *
 * @param {*} res - The object to check.
 * @returns {boolean} True if the object looks like an Express response, false otherwise.
 */
exports.isResponse = function(res) {
  return res && res.app && typeof(res.send) === 'function';
};

/**
 * An Express middleware function that will log all HTTP requests.
 *
 * @function
 */
exports.logger = log4js.connectLogger(logger, {
  level: log4js.levels.TRACE,
  format: ':method :url :status :response-time ms'
});
