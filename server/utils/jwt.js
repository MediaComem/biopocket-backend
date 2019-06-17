/**
 * JWT utilities.
 *
 * @module server/utils/jwt
 */
const jwt = require('jsonwebtoken');
const _ = require('lodash');
const moment = require('moment');
const { promisify } = require('util');

const config = require('../../config');

const signJwt = promisify(jwt.sign);

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
 *   token will expire (defaults to 2 weeks from the time the function is called).
 *   Set to false to generate a token that never expires.
 *
 * @param {number} [properties.iat] - The Unix timestamp (in seconds) at which the
 *   token was issued (defaults to the time the function is called).
 *
 * @param {string[]} properties.scope - The list of scopes this JWT authorizes
 *   access to. This can limit what a JWT can be used for.
 *
 * @param {string} properties.sub - The user identified by the JWT.
 *
 * @returns {Promise<string>} A Promise that will be resolved with the generated token.
 *
 * @see https://jwt.io
 * @see https://tools.ietf.org/html/rfc7519#section-4.1
 */
exports.generateToken = function(properties) {

  const jwtOptions = _.extend({
    iat: properties.iat || moment().unix()
  }, _.omit(properties, 'exp', 'iat'));

  if (properties.exp !== false) {
    jwtOptions.exp = properties.exp || moment().add(2, 'weeks').unix();
  }

  if (properties.exp !== false && !_.isFinite(jwtOptions.exp)) {
    throw new Error(`JWT "exp" option must be a number, got ${jwtOptions.exp} (${typeof jwtOptions.exp})`);
  } else if (properties.exp !== false && jwtOptions.exp <= 0) {
    throw new Error(`JWT "exp" option must be greater than zero, got ${jwtOptions.exp}`);
  } else if (jwtOptions.scope === undefined) {
    throw new Error('JWT "scope" option is required');
  } else if (!_.isArray(jwtOptions.scope) || _.isEmpty(jwtOptions.scope) || jwtOptions.scope.some(value => !_.isString(value))) {
    throw new Error('JWT "scope" option must be an array of strings containing at least one scope');
  } else if (!jwtOptions.sub) {
    throw new Error('JWT "sub" option is required');
  } else if (!_.isString(jwtOptions.sub)) {
    throw new Error('JWT "sub" option must be a string');
  }

  return signJwt(jwtOptions, config.sessionSecret);
};
