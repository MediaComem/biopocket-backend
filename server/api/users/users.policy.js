const _ = require('lodash');

const User = require('../../models/user');
const { ensureRequest } = require('../../utils/express');
const { compactDeep } = require('../utils/api');
const { hasRole, hasScope, sameRecord } = require('../utils/policy');

/**
 * Anyone can register.
 *
 * @function
 * @name canCreate
 * @memberof module:server/api/users
 * @returns {boolean} True if authorization is granted.
 */
exports.canCreate = function() {
  return true;
};

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
  return hasScope(req, 'api:users:retrieve') && (hasRole(req, 'admin') || sameRecord(req.currentUser, req.user));
};

/**
 * Updates a user with the specified data.
 *
 * Note that the user is not included, because setting it on the user model
 * requires hashing, which is an asynchronous operation.
 *
 * @function
 * @name parse
 * @memberof module:server/api/users
 *
 * @param {Object} data - The data (with camel-case property names), typically an API request body.
 * @param {User} [user] - The user to update.
 * @returns {User} The updated user.
 */
exports.parse = function(data, user = new User()) {
  user.parseFrom(data, [ 'firstName', 'lastName', 'email' ]);
  return user;
};

/**
 * Serializes a user for API responses.
 *
 * Detailed properties of a user can only be seen by the user itself or an administrator.
 * Some sensitive properties can only be seen by administrators.
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

  const isAdmin = req.currentUser && req.currentUser.hasRole('admin');
  const isSameUser = req.currentUser && req.currentUser.get('api_id') === user.get('api_id');

  // User properties visible to administrators and to the user itself.
  if (isAdmin || isSameUser) {
    _.extend(serialized, {
      id: user.get('api_id'),
      href: user.get('href'),
      firstName: user.get('first_name'),
      lastName: user.get('last_name'),
      emailVerified: user.get('email_verified'),
      emailVerifiedAt: user.get('email_verified_at'),
      active: user.get('active'),
      provider: user.get('provider'),
      providerId: user.get('provider_id'),
      roles: user.get('roles'),
      createdAt: user.get('created_at'),
      updatedAt: user.get('updated_at')
    });
  }

  // Properties visible only to administrators.
  if (isAdmin) {
    _.extend(serialized, {
      providerData: user.get('provider_data') || {},
      registrationOtp: user.get('registration_otp'),
      registrationOtpCreatedAt: user.get('registration_otp_created_at')
    });

    if (user.related('updated_by')) {
      serialized.updatedBy = user.related('updated_by').get('api_id');
    }
  }

  return compactDeep(serialized);
};
