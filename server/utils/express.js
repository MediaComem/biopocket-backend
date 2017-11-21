/**
 * Express-related utilities.
 *
 * @module utils/express
 */
const config = require('../../config');
const log4js = require('log4js');

const logger = config.logger('express');

/**
 * Ensures that the specified object is an Express request, or throws an error.
 *
 * @param {Request} req - An Express request object.
 * @returns {Request} The first argument, unchanged.
 */
exports.ensureRequest = function(req) {
  if (!req || !req.app) {
    throw new Error('Argument must be an Express request');
  }

  return req;
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
