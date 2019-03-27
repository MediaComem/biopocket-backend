const cors = require('cors');
const { merge } = require('lodash');

const config = require('../../config');

let cachedOriginWhitelist;

module.exports = options => cors(corsOptionsDelegateFactory(options));

/**
 * Returns an asynchronous function that can be used as a delegate to
 * configure the CORS middleware.
 *
 * See https://www.npmjs.com/package/cors#configuring-cors-asynchronously
 *
 * @param {Object} options - Options to pass to the middleware.
 * @returns {Function} A CORS options delegate.
 */
function corsOptionsDelegateFactory(options) {
  return function(req, callback) {
    Promise
      .resolve()
      .then(() => getCorsOptions(req, options))
      .then(result => callback(undefined, result))
      .catch(callback);
  };
}

/**
 * Constructs options for the CORS middleware based on the request.
 *
 * An origin whitelist is set based on the `cors.origin` configuration property by default.
 *
 * @param {Request} req - The Express request object.
 * @param {Object} options - Additional options (which may override the default options).
 * @returns {Object} Options for the CORS middleware.
 */
function getCorsOptions(req, options) {

  const corsOptions = {};

  const originWhitelist = getOriginWhitelist();
  if (originWhitelist) {
    corsOptions.origin = originWhitelist.indexOf(req.get('Origin')) !== -1;
  }

  return merge(corsOptions, options);
}

/**
 * Returns a whitelist of origins allowed to use CORS.
 *
 * The list is based on the `cors.origin` configuration property.
 *
 * @returns {boolean|string[]} An array of allowed origins, or false if none are allowed.
 */
function getOriginWhitelist() {
  if (cachedOriginWhitelist === undefined) {
    const origin = config.cors.origin;
    cachedOriginWhitelist = origin ? origin.split(',') : false;
  }

  return cachedOriginWhitelist;
}
