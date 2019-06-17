/**
 * Test utilities to generate user-related data.
 *
 * @module server/spec/fixtures/user
 */
const chance = require('chance').Chance();
const { hash: hashPassword } = require('bcryptjs');
const _ = require('lodash');
const { unique: uniqueGenerator } = require('test-value-generator');

const { bcryptCost } = require('../../../config');
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
 *     console.log(user.get('email'));  // "bob.doe@example.com"
 *     user.checkPassword('letmein').then(same => {
 *       console.log(same);  // true
 *     });
 *
 * @function
 * @param {Object} [data={}] - Custom user data.
 * @param {string} [data.firstName] - First name.
 * @param {string} [data.lastName] - Last name.
 * @param {string} [data.email] - Email address.
 * @param {boolean} [data.emailVerified=false] - Whether the email address has been verified.
 * @param {Date|Moment|string} [data.emailVerifiedAt] - The date at which the email was verified.
 * @param {string} [data.password] - Password.
 * @param {boolean} [data.active=true] - Whether the user is active or not.
 * @param {string[]} [data.roles=[]] - Roles.
 * @param {string} [data.provider='local'] - The authentication provider.
 * @param {string} [data.providerId] - The authentication ID (defaults to the email address in lower case).
 * @param {Object} [data.providerData] - Additional data from the authentication provider.
 * @param {string} [data.registrationOtp] - The one-time password sent to the user to complete the registration process.
 * @param {Date|Moment|string} [data.registrationOtpCreatedAt] - The date at which the registration OTP was created.
 * @param {Date|Moment|string} [data.createdAt] - Creation date.
 * @param {Date|Moment|string} [data.updatedAt] - Last update date.
 * @returns {Promise<User>} A promise that will be resolved with the saved user.
 */
exports.user = async function(data = {}) {

  const email = data.email || exports.email();
  const password = data.password || exports.password();
  const passwordHash = await hashPassword(password, bcryptCost);

  const user = await createRecord(User, {
    first_name: data.firstName || chance.first().slice(0, 30),
    last_name: data.lastName || chance.last().slice(0, 30),
    email,
    email_verified: _.get(data, 'emailVerified', true),
    email_verified_at: data.emailVerifiedAt,
    password_hash: passwordHash,
    active: _.get(data, 'active', true),
    roles: data.roles || [],
    provider: data.provider || 'local',
    provider_id: data.providerId || email.toLowerCase(),
    provider_data: data.providerData,
    registration_otp: data.registrationOtp,
    registration_otp_created_at: data.registrationOtpCreatedAt,
    created_at: data.createdAt,
    updated_at: data.updatedAt
  });

  await user.load('updatedBy');

  return user;
};

/**
 * Generates a random user record with the admin role and saves it to the database.
 *
 * Takes the same arguments as the `user` function.
 *
 * @function
 * @param {Object} [data={}] - Custom user data.
 * @returns {Promise<User>} A promise that will be resolved with the saved user.
 * @see #.user
 */
exports.admin = data => exports.user(_.merge({}, data, { roles: [ 'admin' ] }));

/**
 * Generates a unique random email address.
 *
 * @function
 * @returns {string} An email address.
 */
exports.email = uniqueGenerator(() => `${chance.first().toLowerCase()}.${chance.last().toLowerCase()}@example.com`.replace(/\s+/g, '-'));

/**
 * Generates a unique random password for a user account.
 *
 * @function
 * @returns {string} A password.
 */
exports.password = uniqueGenerator(() => chance.string());

/**
 * Generates a unique registration OTP for a user account.
 *
 * @function
 * @returns {string} A registration OTP.
 */
exports.registrationOtp = uniqueGenerator(() => String(chance.integer({ min: 100000, max: 999999 })));
