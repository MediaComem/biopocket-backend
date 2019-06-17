/**
 * @module server/spec/expectations/jwt
 */
const jwt = require('jsonwebtoken');
const { has, isFunction } = require('lodash');
const moment = require('moment');
const { promisify } = require('util');

const config = require('../../../config');
const { expect } = require('../utils');
const { toTimestamp } = require('../utils/conversion');

const verifyJwt = promisify(jwt.verify);

/**
 * Asserts that a JWT is valid and contains the expected claims.
 *
 * @param {string} actual - The JWT to check.
 * @param {Object} expected - An object representing the claims the JWT is expected to have.
 * @param {number|Date|Moment|Function} [expected.exp] - The expected expiration
 *   date. If not specified, the JWT is expected to never expire. If it's a
 *   function, it's called with a chai expectation chain so you can make a
 *   custom assertion.
 * @param {number|Date|Moment|Function} expected.iat - The expected issue date
 *   If it's a function, it's called with a chai expectation chain so you can
 *   make a custom assertion.
 * @param {string} expected.sub - The expected subject.
 * @param {string[]} expected.scope - The expected authorization scopes (this is a custom claim).
 * @see {@link https://en.wikipedia.org/wiki/JSON_Web_Token#Standard_fields}
 */
exports.expectJwt = async function(actual, expected) {

  expect(actual, 'jwt').to.be.a('string');

  const claims = await verifyJwt(actual, config.sessionSecret);
  expect(claims, 'jwt.claims').to.be.an('object');

  // Make the `exp` assertion first so that we know whether to expect an `exp`
  // property in the next assertion.
  if (has(expected, 'exp')) {
    expectNumericDate(claims.exp, 'jwt.claims.exp', expected.exp);
  }

  const expectedKeys = [ 'iat', 'scope', 'sub' ];
  if (has(claims, 'exp')) {
    expectedKeys.unshift('exp');
  }

  expect(claims, 'jwt.claims').to.have.all.keys(expectedKeys);

  expectNumericDate(claims.iat, 'jwt.claims.iat', expected.iat);
  expect(claims.sub, 'jwt.claims.sub').to.equal(expected.sub);
  expect(claims.scope, 'jwt.claims.scope').to.eql(expected.scope || [ 'api' ]);
};

/**
 * Asserts that a JWT timestamp (see {@link
 * https://tools.ietf.org/html/rfc7519#section-2}) is equal to a specific value
 * or satisfies a custom expectation.
 *
 * @example
 * expectNumericDate(value, 'jwt.claims.exp', Date.now());
 * expectNumericDate(value, 'jwt.claims.exp', expectation => expectation.gte(Date.now()));
 *
 * @param {*} actual - The value to check.
 * @param {string} description - A description of the value for use in validation error messages.
 * @param {number|Date|Moment|Function} expected - The exact expected timestamp,
 *   or a function that will be passed the assertion to build on.
 */
function expectNumericDate(actual, description, expected) {
  if (isFinite(expected) || expected instanceof Date || moment.isMoment(expected)) {
    expect(actual, description).to.equal(toTimestamp(expected));
  } else if (isFunction(expected)) {
    expected(expect(actual, description));
  } else {
    throw new Error(`Expected property "${description}" must be an exact number or an array of one or two numbers representing an inclusive range`);
  }
}
