const { ensureRequest } = require('./express');

const DEFAULT_LOCALE = 'fr';
const SUPPORTED_LOCALES = [ 'fr' ];

/**
 * Returns the current locale based on the request's Accept-Language header.
 *
 * @param {Request} req - An Express request object.
 * @returns {string} The current locale.
 */
exports.getLocale = function(req) {
  ensureRequest(req);
  return req.acceptsLanguages(...SUPPORTED_LOCALES) || DEFAULT_LOCALE;
};
