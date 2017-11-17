const _ = require('lodash');
const bcrypt = require('bcryptjs');

const Abstract = require('./abstract');
const config = require('../../config');
const db = require('../db');

const proto = Abstract.prototype;

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

  hasPassword: function(password) {
    return password && bcrypt.compareSync(password, this.get('password_hash'));
  },

  isActive: function() {
    return !!this.get('active');
  }
});

module.exports = db.bookshelf.model('User', User);
