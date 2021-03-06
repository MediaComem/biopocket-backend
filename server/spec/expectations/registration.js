const Registration = require('../../models/registration');
const { checkRecord, expect, toArray } = require('../utils');

module.exports = async function(actual, expected) {

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
  await module.exports.inDb(actual);
};

module.exports.inDb = async function(expected) {

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
