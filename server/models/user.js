const bcrypt = require('bcryptjs');
const _ = require('lodash');

const config = require('../../config');
const db = require('../db');
const jwt = require('../utils/jwt');
const Abstract = require('./abstract');

/**
 * A user of the BioPocket platform.
 *
 * ## Database columns
 *
 * * **id** (`bigint`) - Internal ID (used for joins).
 * * **api_id** (`uuid`) - External ID (used in the API).
 * * **firstName** (`string`) - User's first name.
 * * **lastName** (`string`) - User's last name.
 * * **email** (`string`) - Email address.
 * * **email_verified** (`boolean`) - Whether the email address has been verified (i.e. the user followed the link in the registration email).
 * * **email_verified_at** (`datetime`, optional) - The date at which the email was verified.
 * * **password_hash** (`string`) - Bcrypt hash of the user's password.
 * * **active** (`boolean`) - Indicates whether the user can use the platform or has been deactivated by an administrator.
 * * **provider** (`string`) - The authentication provider (only `local` is supported for now).
 * * **providerId** (`string`) - The user's identifier for the authentication provider. It is unique within the scope of the `provider`.
 *
 *   When the provider is `local`, this is the user's email address in lower case.
 * * **providerData** (`object`) - Additional data from the authentication provider.
 * * **registration_otp** (`string`, optional) - The one-time password sent to the user to complete the registration process.
 * * **registration_otp_created_at** (`datetime`, optional) - The date at which the registration OTP was created.
 * * **roles** (`string[]`) - Roles of the user (used for authorization).
 * * **created_at** (`datetime`) - Time at which the user was created.
 * * **updated_at** (`datetime`) - Time at which the user was last modified (equal to the creation date if never modified).
 * * **updated_by** (`bigint`) - The ID of the user who last updated this user (e.g. the user itself or an administrator).
 *
 * ## Virtual properties
 *
 * * **password** (`string`) - Setting this property generates a new bcrypt hash and updates the `password_hash` column.
 *
 * @class
 * @extends Abstract
 * @see http://bookshelfjs.org
 */
const User = Abstract.extend({
  tableName: 'users',

  timestamps: true,

  /**
   * Returns a JWT that can be used to authenticate as this user.
   *
   * @instance
   * @memberof User
   * @param {Object} properties - JWT properties, passed to `generateToken` in the `utils/jwt` module.
   * @returns {Promise<string>} A Promise that will be resolved with the generated token.
   */
  generateJwt(properties) {
    return jwt.generateToken(_.extend({
      scope: [ 'api' ],
      sub: this.get('api_id')
    }, properties));
  },

  /**
   * Generates an OTP that the user can use to complete the registration process
   * and sets it on this user object so that it can be persisted to the
   * database.
   *
   * **Warning:** calling this method does not trigger a save to the database.
   * It only sets the values on the user object.
   *
   * @instance
   * @memberof User
   * @see {@link https://en.wikipedia.org/wiki/One-time_password}
   */
  generateNewRegistrationOtp() {
    this.set('registration_otp', generateRegistrationOtp());
    this.set('registration_otp_created_at', new Date());
  },

  /**
   * Indicates whether this user has the specified password or not.
   *
   * @instance
   * @memberof User
   * @param {string} password - The password to check.
   * @returns {Promise<boolean>} A Promise that will be resolved with true if the user's password is the same as the specified one.
   */
  checkPassword(password) {
    if (!password) {
      return false;
    }

    return bcrypt.compare(password, this.get('password_hash'));
  },

  /**
   * Asynchronously hashes and sets the user's password.
   *
   * @instance
   * @memberof User
   * @param {string} password - The password to set.
   */
  async hashAndSetPassword(password) {
    if (!_.isString(password) || !password.trim().length) {
      throw new Error('Password must be a non-empty string');
    }

    this.set('password_hash', await bcrypt.hash(password, config.bcryptCost));
  },

  /**
   * Indicates whether this user has the specified role.
   *
   * **WARNING:** this methods always returns true if the user has the role,
   * even if the user is inactive. It is not sufficient to determine whether
   * the user is currently authorized to perform the role.
   *
   * @instance
   * @memberof User
   * @param {string} role - The role to check.
   * @returns {boolean} True if the specified role is among the user's assigned roles.
   */
  hasRole(role) {
    return _.includes(this.get('roles'), role);
  },

  /**
   * Indicates whether this user is active. Users may be deactivated by administrators.
   *
   * @instance
   * @memberof User
   * @returns {boolean} True if this user is active.
   */
  isActive() {
    return Boolean(this.get('active'));
  },

  /**
   * Indicates whether this user has completed the registration process.
   *
   * Local users are considered registered only once their email has been
   * validated after following the link sent in the registration email.
   *
   * @instance
   * @memberof User
   * @returns {boolean} True if the user has registered.
   */
  isRegistered() {
    return this.get('provider') === 'local' && Boolean(this.get('email_verified'));
  },

  /**
   * Returns the relation to the user who last updated this user (e.g. the user
   * itself or an administrator).
   *
   * @instance
   * @memberof User
   * @returns {Model} A Bookshelf relation.
   */
  updatedBy() {
    return this.belongsTo('User', 'updated_by');
  }
}, {
  /**
   * Returns a Bookshelf query to find a user with the specified email.
   * The search is case-insensitive.
   *
   * @example
   * const user = await User.whereEmail('jdoe@example.com');
   *
   * @static
   * @memberof User
   * @param {string} email - The email to look for.
   * @returns {Query} A Bookshelf query.
   */
  whereEmail: function(email) {
    return this.query(builder => builder.whereRaw('LOWER(email) = LOWER(?)', email));
  }
});

/**
 * Generates an OTP that a user can use to complete the registration process.
 *
 * @returns {string} A registration OTP.
 * @see {@link https://en.wikipedia.org/wiki/One-time_password}
 */
function generateRegistrationOtp() {
  return String(_.random(1000000, 9999999));
}

module.exports = db.bookshelf.model('User', User);
