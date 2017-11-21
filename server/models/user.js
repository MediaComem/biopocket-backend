const _ = require('lodash');
const bcrypt = require('bcryptjs');

const Abstract = require('./abstract');
const config = require('../../config');
const db = require('../db');
const jwt = require('../utils/jwt');

const proto = Abstract.prototype;

/**
 * A user of the BioPocket platform.
 *
 * ## Database columns
 *
 * * **id** (`bigint`) - Internal ID (used for joins).
 * * **api_id** (`uuid`) - External ID (used in the API).
 * * **email** (`string`) - E-mail address.
 * * **password_hash** (`string`) - Bcrypt hash of the user's password.
 * * **active** (`boolean`) - Indicates whether the user can use the platform or has been deactivated by an administrator.
 * * **roles** (`string[]`) - Roles of the user (used for authorization).
 * * **created_at** (`datetime`) - Time at which the user was created.
 * * **updated_at** (`datetime`) - Time at which the user was last modified (equal to the creation date if never modified).
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

  virtuals: _.merge({
    password: {
      get: function() {
        return this._password;
      },

      set: function(password) {
        this._password = password;

        if (_.isString(password) && password.length) {
          const salt = bcrypt.genSaltSync(config.bcryptCost);
          this.set('password_hash', bcrypt.hashSync(password, salt));
        } else {
          this.unset('password_hash');
        }
      }
    }
  }, proto.virtuals),

  /**
   * Returns a JWT that can be used to authenticate as this user.
   *
   * @instance
   * @memberof User
   * @param {object} properties - JWT properties, passed to `generateToken` in the `utils/jwt` module.
   * @returns {string} A JWT.
   */
  generateJwt: function(properties) {
    return jwt.generateToken(_.extend({
      sub: this.get('api_id')
    }, properties));
  },

  /**
   * Indicates whether this user has the specified password or not.
   *
   * @instance
   * @memberof User
   * @param {string} password - The password to check.
   * @returns {boolean} True if the user's password is the same as the specified one.
   */
  hasPassword: function(password) {
    return !!password && bcrypt.compareSync(password, this.get('password_hash'));
  },

  /**
   * Indicates whether this user has the specified role.
   *
   * **WARNING:** this methods always returns true if the user has the role,
   * even if the user is inactive.
   *
   * @instance
   * @memberof User
   * @param {string} role - The role to check.
   * @returns {boolean} True if the specified role is among the user's assigned roles.
   */
  hasRole: function(role) {
    return _.includes(this.get('roles'), role);
  },

  /**
   * Indicates whether this user is active. Users may be deactivated by administrators.
   *
   * @instance
   * @memberof User
   * @returns {boolean} True if this user is active.
   */
  isActive: function() {
    return !!this.get('active');
  }
});

module.exports = db.bookshelf.model('User', User);
