/**
 * Utilities to simplify the writing of authorization policies.
 *
 * @module api/utils/policy
 */
const errors = require('./errors');
const { ensureRequest } = require('../../utils/express');

/**
 * Ensures that an active user has successfully authenticated for the specified
 * request, or throws an HTTP 401 Unauthorized error.
 *
 * @param {Request} req - An Express request object.
 * @returns {User} The authenticated user.
 */
exports.ensureAuthenticated = function(req) {
  ensureRequest(req);

  if (!req.jwtToken) {
    throw errors.missingAuthorization();
  } else if (!req.currentUser || !req.currentUser.get('active')) {
    throw errors.invalidAuthorization();
  }

  return req.currentUser;
};

/**
 * Indicates whether an active user who has the requested role has successfully authenticated.
 *
 * @param {Request} req - An Express request object.
 * @param {string} role - The requested role.
 * @returns {boolean} True if the current user has the specified role, false otherwise.
 */
exports.hasRole = function(req, role) {
  ensureRequest(req);
  return req.currentUser && req.currentUser.get('active') && req.currentUser.hasRole(role);
};

/**
 * Indicates whether two database records are the same record (i.e. they have the same ID).
 *
 * @param {Record} r1 - The first database record.
 * @param {Record} r2 - The second database record.
 * @returns {boolean} True if both objects are database records with the same ID, false otherwise.
 */
exports.sameRecord = function(r1, r2) {
  return r1 && r2 && r1.constructor === r2.constructor && r1.get('id') && r1.get('id') === r2.get('id');
};
