const _ = require('lodash');

const { ensureRequest } = require('../../utils/express');
const { hasRole, sameRecord } = require('../utils/policy');

/**
 * An authenticated user can retrieve himself. Administrators can retrieve anyone.
 *
 * @function
 * @name canRetrieve
 * @memberof module:server/api/users
 * @param {Request} req - The Express request object.
 * @returns {boolean} True if authorization is granted.
 */
exports.canRetrieve = function(req) {
  return hasRole(req, 'admin') || sameRecord(req.currentUser, req.user);
};

/**
 * Serializes a user for API responses.
 *
 * Detailed properties of a user can only be seen by the user itself or an administrator.
 *
 * @function
 * @name serialize
 * @memberof module:server/api/users
 *
 * @param {Request} req - The Express request object.
 * @param {User} user - A user record.
 * @returns {Object} A serialized user.
 */
exports.serialize = function(req, user) {
  ensureRequest(req, 'First argument');

  const serialized = {
    email: user.get('email')
  };

  const admin = req.currentUser && req.currentUser.hasRole('admin');
  const sameUser = req.currentUser && req.currentUser.get('api_id') === user.get('api_id');

  if (admin || sameUser) {
    _.extend(serialized, {
      id: user.get('api_id'),
      href: user.get('href'),
      active: user.get('active'),
      roles: user.get('roles'),
      createdAt: user.get('created_at'),
      updatedAt: user.get('updated_at')
    });
  }

  return serialized;
};
