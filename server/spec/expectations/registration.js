const Registration = require('../../models/registration');
const { checkRecord, expect } = require('../utils');
const { toArray } = require('../utils/conversion');

/**
 * Asserts that a registration response from the API has the expected
 * properties, then asserts that an equivalent registration exists in the
 * database.
 *
 * @param {Object} actual - The registration to check.
 * @param {Object} expected - Expected registration properties.
 */
exports.expectRegistration = async function(actual, expected) {

  expect(actual, 'res.body').to.be.an('object');

  const expectedKeys = [ 'id', 'firstname', 'lastname', 'email', 'createdAt', 'updatedAt' ];

  expect(actual, 'res.body').to.have.all.keys(expectedKeys);

  if (expected.id) {
    expect(actual.id, 'registration.id').to.equal(expected.id);
  } else {
    expect(actual.id, 'registration.id').to.be.a('string');
  }

  expect(actual.firstname, 'registration.firstname').to.equal(expected.firstname);
  expect(actual.lastname, 'registration.lastname').to.equal(expected.lastname);
  expect(actual.email, 'registration.email').to.equal(expected.email);

  expect(actual.createdAt, 'registration.createdAt').to.be.iso8601(...toArray(expected.createdAt));

  if (expected.updatedAt === 'createdAt') {
    expect(actual.updatedAt, 'registration.updatedAt').to.equal(actual.createdAt);
  } else {
    expect(actual.updatedAt, 'registration.updatedAt').to.be.iso8601(...toArray(expected.updatedAt));
  }

  // Check that the corresponding registration exists in the database.
  await exports.expectRegistrationInDb(actual);
};

/**
 * Asserts that a registration exists in the database with the specified properties.
 *
 * Note that database columns are underscored while expected properties are
 * camel-cased. This allows calling this method with an API response in JSON.
 *
 * @param {Object} expected - The action that is expected to be in the database.
 */
exports.expectRegistrationInDb = async function(expected) {

  const registration = await checkRecord(Registration, expected.id);
  expect(registration, 'db.registration').to.be.an.instanceof(Registration);

  expect(registration.get('api_id'), 'db.registration.api_id').to.equal(expected.id);
  expect(registration.get('id'), 'db.registration.id').to.be.a('string');
  expect(registration.get('firstname', 'db.registration.firstname')).to.equal(expected.firstname);
  expect(registration.get('lastname'), 'db.registration.lastname').to.equal(expected.lastname);
  expect(registration.get('email', 'db.registration.email')).to.equal(expected.email);
  expect(registration.get('created_at'), 'db.registration.created_at').to.be.sameMoment(expected.createdAt);
  expect(registration.get('updated_at'), 'db.registration.updated_at').to.be.sameMoment(expected.updatedAt);
};
