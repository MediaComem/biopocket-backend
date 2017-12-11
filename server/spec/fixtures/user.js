/**
 * Test utilities to generate user-related data.
 *
 * @module server/spec/fixtures/user
 */
const chance = require('chance').Chance();
const _ = require('lodash');
const { unique: uniqueGenerator } = require('test-value-generator');

const User = require('../../models/user');
const { createRecord } = require('../utils');

/**
 * Generates a random user record and saves it to the database.
 *
 * All of the generated user's properties are assigned random or default
 * values unless changed with the `data` argument.
 *
 *     const userFixtures = require('../spec/fixtures/user');
 *
 *     const user = await userFixtures.user({
 *       password: 'letmein'
 *     });
 *
 *     console.log(user.hasPassword('letmein'));  // true
 *     console.log(user.get('email'));            // "bob.doe@example.com"
 *
 * @function
 * @param {object} [data={}] - Custom user data.
 * @param {string} [data.email]
 * @param {string} [data.password]
 * @param {boolean} [data.active=true]
 * @param {string[]} [data.roles=[]]
 * @param {string} [data.createdAt]
 * @param {string} [data.updatedAt]
 * @returns {Promise<User>} A promise that will be resolved with the saved user.
 */
exports.user = function(data = {}) {
  return createRecord(User, {
    email: data.email || exports.email(),
    password: data.password || exports.password(),
    active: _.get(data, 'active', true),
    roles: data.roles || [],
    created_at: data.createdAt,
    updated_at: data.updatedAt
  });
};

/**
 * Generates a random user record with the admin role and saves it to the database.
 *
 * Takes the same arguments as the `user` function.
 *
 * @function
 * @param {object} [data={}] - Custom user data.
 * @returns {Promise<User>} A promise that will be resolved with the saved user.
 * @see #.user
 */
exports.admin = function(data) {
  return exports.user(_.merge({}, data, { roles: [ 'admin' ] }));
};

/**
 * Generates a unique random e-mail address.
 *
 * @function
 * @returns {string} An e-mail address.
 */
exports.email = uniqueGenerator(function() {
  return `${chance.first().toLowerCase()}.${chance.last().toLowerCase()}@example.com`;
});

/**
 * Generates a unique random password for a user account.
 *
 * @function
 * @returns {string} A password.
 */
exports.password = uniqueGenerator(function() {
  return chance.string();
});
