const bcrypt = require('bcryptjs');
const _ = require('lodash');

const { compactDeep } = require('../../api/utils/api');
const User = require('../../models/user');
const { checkRecord, expect } = require('../utils');
const { toArray } = require('../utils/conversion');

// Properties that are expected to always be in a user's JSON representation.
const mandatoryProperties = [
  'active',
  'createdAt',
  'firstName',
  'id',
  'email',
  'emailVerified',
  'lastName',
  'provider',
  'providerId',
  'roles',
  'updatedAt'
];

// Properties that may or may not be in a user's JSON representation depending
// on the user's state (i.e. whether the registration process was completed).
const optionalProperties = [
  'emailVerifiedAt',
  'providerData',
  'registrationOtp',
  'registrationOtpCreatedAt',
  'updatedBy'
];

/**
 * Asserts that a user response from the API has the expected properties, then
 * asserts that an equivalent user exists in the database.
 *
 * @param {Object} actual - The user to check.
 * @param {Object} expected - Expected user properties.
 * @returns {Promise<User>} A promise that will be resolved with the user, or rejected if an assertion fails.
 */
exports.expectUser = function(actual, expected) {

  expect(actual, 'res.body').to.be.an('object');

  const expectedProperties = [
    ...mandatoryProperties,
    ...optionalProperties.filter(property => _.has(expected, property))
  ].sort();

  expect(actual, 'res.body').to.have.all.keys(expectedProperties);

  expect(actual.active, 'user.active').to.equal(_.get(expected, 'active', false));

  if (expected.id) {
    expect(actual.id, 'user.id').to.equal(expected.id);
  } else {
    expect(actual.id, 'user.id').to.be.a('string');
  }

  expect(actual.firstName, 'user.firstName').to.equal(expected.firstName);
  expect(actual.lastName, 'user.lastName').to.equal(expected.lastName);
  expect(actual.email, 'user.email').to.equal(expected.email);
  expect(actual.emailVerified, 'user.emailVerified').to.equal(_.get(expected, 'emailVerified', false));

  if (_.has(expected, 'emailVerifiedAt')) {
    expect(actual.emailVerifiedAt, 'user.emailVerifiedAt').to.be.iso8601(...toArray(expected.emailVerifiedAt));
  }

  expect(actual.provider, 'user.provider').to.equal(_.get(expected, 'provider', 'local'));
  expect(actual.providerId, 'user.providerId').to.equal(expected.providerId);

  if (expected.providerData) {
    expect(actual.providerData, 'user.providerData').to.eql(expected.providerData);
  }

  if (expected.registrationOtp === true) {
    expect(actual.registrationOtp, 'user.registrationOtp').to.be.a('string');
    expect(actual.registrationOtp, 'user.registrationOtp').to.match(/^\d{7}$/);
  } else {
    expect(actual.registrationOtp, 'user.registrationOtp').to.equal(expected.registrationOtp);
  }

  if (_.has(expected, 'registrationOtpCreatedAt')) {
    expect(actual.registrationOtpCreatedAt, 'user.registrationOtpCreatedAt').to.be.iso8601(...toArray(expected.registrationOtpCreatedAt));
  }

  expect(actual.roles, 'user.roles').to.eql(_.get(expected, 'roles', []));

  expect(actual.createdAt, 'user.createdAt').to.be.iso8601(...toArray(expected.createdAt));

  if (expected.updatedAt === 'createdAt') {
    expect(actual.updatedAt, 'user.updatedAt').to.equal(actual.createdAt);
  } else {
    expect(actual.updatedAt, 'user.updatedAt').to.be.iso8601(...toArray(expected.updatedAt));
  }

  expect(actual.updatedBy, 'user.updatedBy').to.equal(expected.updatedBy);

  // Check that the corresponding user exists in the database.
  return exports.expectUserInDb(_.merge({}, actual, _.pick(expected, 'db', 'password')));
};

/**
 * Asserts that a user exists in the database with the specified properties.
 *
 * Note that database columns are underscored while expected properties are
 * camel-cased. This allows calling this method with an API response in JSON.
 *
 * @param {Object} expected - The user that is expected to be in the database.
 * @returns {Promise<User>} A promise that will be resolved with the user, or rejected if an assertion fails.
 */
exports.expectUserInDb = async function(expected) {

  const user = await checkRecord(User, expected.id);
  expect(user, 'db.user').to.be.an.instanceof(User);

  // Load relations.
  await user.load('updatedBy');

  expect(user.get('active'), 'db.user.active').to.equal(expected.active);
  expect(user.get('api_id'), 'db.user.api_id').to.equal(expected.id);
  expect(user.get('first_name'), 'db.user.first_name').to.equal(expected.firstName);
  expect(user.get('id'), 'db.user.id').to.be.a('string');
  expect(user.get('email'), 'db.user.email').to.equal(expected.email);
  expect(user.get('email_verified'), 'db.user.email_verified').to.equal(expected.emailVerified);
  expect(user.get('last_name'), 'db.user.last_name').to.equal(expected.lastName);
  expect(user.get('provider'), 'db.user.provider').to.equal(expected.provider);
  expect(user.get('provider_id'), 'db.user.provider_id').to.equal(expected.providerId);
  expect(user.get('roles'), 'db.user.roles').to.eql(expected.roles);
  expect(user.get('created_at'), 'db.user.created_at').to.be.sameMoment(expected.createdAt);
  expect(user.get('updated_at'), 'db.user.updated_at').to.be.sameMoment(expected.updatedAt);
  expect(user.related('updatedBy').get('api_id'), 'db.user.updated_by').to.equal(expected.updatedBy);

  if (!expected.emailVerifiedAt) {
    expect(user.get('email_verified_at'), 'db.user.email_verified_at').to.equal(null);
  } else {
    expect(user.get('email_verified_at'), 'db.user.email_verified_at').to.be.sameMoment(expected.emailVerifiedAt);
  }

  if (_.isEmpty(expected.providerData)) {
    expect(user.get('provider_data'), 'db.user.provider_data').to.equal(null);
  } else {
    expect(user.get('provider_data'), 'db.user.provider_data').to.eql(expected.providerData);
  }

  const expectedRegistrationOtp = _.get(expected, 'db.registrationOtp', expected.registrationOtp);
  if (!expectedRegistrationOtp) {
    expect(user.get('registration_otp'), 'db.user.registration_otp').to.equal(null);
  } else if (expectedRegistrationOtp === true) {
    expect(user.get('registration_otp'), 'db.user.registration_otp').to.be.a('string');
    expect(user.get('registration_otp'), 'db.user.registration_otp').to.match(/^\d{7}$/);
  } else {
    expect(user.get('registration_otp'), 'db.user.registration_otp').to.equal(expectedRegistrationOtp);
  }

  const expectedRegistrationOtpCreatedAt = _.get(expected, 'db.registrationOtpCreatedAt', expected.registrationOtpCreatedAt);
  if (!expectedRegistrationOtpCreatedAt) {
    expect(user.get('registration_otp_created_at'), 'db.user.registration_otp_created_at').to.equal(null);
  } else {
    expect(user.get('registration_otp_created_at'), 'db.user.registration_otp_created_at').to.be.an.instanceof(Date);
    expect(user.get('registration_otp_created_at').toISOString(), 'db.user.registration_otp_created_at').to.be.iso8601(...toArray(expectedRegistrationOtpCreatedAt));
  }

  const expectedPassword = _.get(expected, 'db.password', expected.password);
  if (expectedPassword) {
    await expect(bcrypt.compare(expectedPassword, user.get('password_hash')), 'db.user.password_hash').to.eventually.equal(true);
    await expect(user.checkPassword(expectedPassword), 'db.user.password_hash').to.eventually.equal(true);
  } else {
    expect(user.get('password_hash')).to.be.a('string');
  }

  return user;
};

/**
 * Returns an object representing the expected properties of a user, based on the specified user.
 * (Can be used, for example, to check if a returned API response matches a user in the database.)
 *
 * @param {User} user - The user to build the expectations from.
 * @param {...Object} changes - Additional expected changes compared to the specified user (merged with Lodash's `extend`).
 * @returns {Object} An expectations object.
 */
exports.getExpectedUser = function(user, ...changes) {
  return _.extend(compactDeep({
    active: user.get('active'),
    createdAt: user.get('created_at'),
    firstName: user.get('first_name'),
    id: user.get('api_id'),
    email: user.get('email'),
    emailVerified: user.get('email_verified'),
    emailVerifiedAt: user.get('email_verified_at'),
    lastName: user.get('last_name'),
    provider: user.get('provider'),
    providerId: user.get('provider_id'),
    providerData: user.get('provider_data'),
    roles: user.get('roles'),
    updatedAt: user.get('updated_at'),
    updatedBy: user.related('updatedBy').get('api_id'),
    db: {
      registrationOtp: user.get('registration_otp'),
      registrationOtpCreatedAt: user.get('registration_otp_created_at')
    }
  }), ...changes);
};
