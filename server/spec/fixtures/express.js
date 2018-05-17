/**
 * Test utilities to mock Express objects.
 *
 * @module server/spec/fixtures/express
 */
const chance = require('chance').Chance();
const { stub } = require('sinon');

const app = require('../../app');

/**
 * Returns an object that looks like an Express request and that has various Sinon stubs ready for testing.
 *
 * @param {object} [data] - Optional request properties to override the defaults.
 * @param {Application} [data.app] - The Express application, defaults to the project's application.
 * @param {Function} [data.get] - A function that retrieves a header's value(s) by name (defaults to a stub).
 * @param {string} [data.method] - The HTTP method (defaults to `GET`).
 * @param {string} [data.path] - The path of the URL (defaults to a random path, e.g. `/foo`).
 * @param {object} [data.query] - The query parameters (defaults to an empty object).
 * @returns {object} A mocked Express request.
 */
exports.req = function(data = {}) {
  return {
    app: data.app || app,
    body: data.body,
    get: data.get || stub(),
    method: data.method || 'GET',
    path: data.path || `/${chance.word()}`,
    query: data.query || {}
  };
};

/**
 * Returns an object that looks like an Express response and that has various Sinon stubs ready for testing.
 *
 * @param {object} [data] - Optional request properties to override the defaults.
 * @param {Application} [data.app] - The Express application, defaults to the project's application.
 * @param {Function} [data.send] - A function that sends the response to the client with an optional body (defaults to a stub).
 * @param {Function} [data.set] - A function that sets a header's value(s) (defaults to a stub).
 * @returns {object} A mocked Express response.
 */
exports.res = function(data = {}) {
  return {
    app: data.app || app,
    send: data.send || stub(),
    set: data.set || stub()
  };
};
