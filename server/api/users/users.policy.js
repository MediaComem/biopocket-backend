const _ = require('lodash');

const User = require('../../models/user');
const { ensureRequest } = require('../../utils/express');
const { ensureAuthenticated, hasRole, sameRecord } = require('../utils/policy');

/**
 * An authenticated user can retrieve himself. Administrators can retrieve anyone.
 *
 * @function
 * @name canRetrieve
 * @memberof module:api/users
 */
exports.canRetrieve = function(req) {
  ensureAuthenticated(req);
  return hasRole(req, 'admin') || sameRecord(req.currentUser, req.user);
};

/**
 * Serializes a user for API responses.
 *
 * Detailed properties of a user can only be seen by the user itself or an administrator.
 *
 * @function
 * @name serialize
 * @memberof module:api/users
 *
 * @param {Request} req - The Express request object.
 * @param {User} user - A user record.
 * @returns {object} A serialized user.
 */
exports.serialize = function(req, user) {
  ensureRequest(req);

  const serialized = {
    email: user.get('email')
  };

  const admin = req.currentUser && req.currentUser.hasRole('admin');
  const sameUser = req.currentUser && req.currentUser.get('api_id') == user.get('api_id');

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
