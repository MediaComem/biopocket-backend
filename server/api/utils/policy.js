/**
 * Utilities to simplify the writing of authorization policies.
 *
 * @module server/api/utils/policy
 */
const { intersection, isArray, isEmpty } = require('lodash');

const { ensureRequest } = require('../../utils/express');

/**
 * Indicates whether an active user who has the requested role has successfully authenticated.
 *
 * @param {Request} req - An Express request object.
 * @param {string} role - The requested role.
 * @returns {boolean} True if the current user has the specified role, false otherwise.
 */
exports.hasRole = function(req, role) {
  ensureRequest(req, 'First argument');
  return req.currentUser && req.currentUser.isActive() && req.currentUser.hasRole(role);
};

/**
 * Indicates whether the JWT token in the Authorization header is authorized to
 * access the specified scope.
 *
 * Scopes are semicolon-delimited strings. A token may contain a parent scope,
 * giving it access to all the correspond child scopes. For example, given the
 * scope `api:foo:bar`, a JWT containing any of the following scopes will be
 * considered to have that scope:
 *
 * * `api`
 * * `api:foo`
 * * `api:foo:bar`
 *
 * @param {Request} req - An Express request object.
 * @param {string} scope - The requested scope.
 * @returns {boolean} True if the token is authorized, false otherwise.
 */
exports.hasScope = function(req, scope) {
  ensureRequest(req, 'First argument');

  const parts = scope.split(':');
  const validScopes = parts.map((part, i) => parts.slice(0, i + 1).join(':'));

  return req.jwtToken && isArray(req.jwtToken.scope) && !isEmpty(intersection(req.jwtToken.scope, validScopes));
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
