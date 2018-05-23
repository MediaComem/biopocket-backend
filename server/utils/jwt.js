/**
 * JWT utilities.
 *
 * @module server/utils/jwt
 */
const jwt = require('jsonwebtoken');
const _ = require('lodash');
const moment = require('moment');

const config = require('../../config');

/**
 * Generates a JWT token with the specified properties.
 *
 * This function will check that:
 *
 * * The `exp` claim is set and is valid.
 * * The `sub` claim is set.
 *
 * Only some JWT claims are documented in the function's parameters, but other
 * claims can be included.
 *
 * @param {Object} properties - Arbitrary JWT properties (see documentation links).
 *
 * @param {number} [properties.exp] - The Unix timestamp (in seconds) at which the
 *   token will expire (defaults to 1 hour from the time the function is called).
 *
 * @param {number} [properties.iat] - The Unix timestamp (in seconds) at which the
 *   token was issued (defaults to the time the function is called).
 *
 * @param {string} properties.sub - The principal of the JWT.
 *
 * @returns {string} A JWT.
 *
 * @see https://jwt.io
 * @see https://tools.ietf.org/html/rfc7519#section-4.1
 */
exports.generateToken = function(properties) {

  const jwtOptions = _.extend({
    exp: properties.exp || moment().add(1, 'hour').unix(),
    iat: properties.iat || moment().unix()
  }, _.omit(properties, 'exp', 'iat'));

  if (jwtOptions.exp === undefined) {
    throw new Error('JWT "exp" option is required');
  } else if (!_.isFinite(jwtOptions.exp)) {
    throw new Error(`JWT "exp" option must be a number, got ${jwtOptions.exp} (${typeof jwtOptions.exp})`);
  } else if (jwtOptions.exp <= 0) {
    throw new Error(`JWT "exp" option must be greater than zero, got ${jwtOptions.exp}`);
  } else if (!jwtOptions.sub) {
    throw new Error('JWT "sub" option is required');
  } else if (!_.isString(jwtOptions.sub)) {
    throw new Error('JWT "sub" option must be a string');
  }

  return jwt.sign(jwtOptions, config.sessionSecret);
};
