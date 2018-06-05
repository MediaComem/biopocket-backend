const { has } = require('lodash');

const Theme = require('../../models/theme');
const { checkRecord, expect, toArray } = require('../utils');

module.exports = async function(actual, expected) {
  expect(actual, 'res.body').to.be.an('object');

  const expectedKeys = [ 'id', 'title', 'description', 'photoUrl', 'createdAt', 'updatedAt' ];

  if (has(expected, 'source')) {
    expectedKeys.push('source');
  }

  expect(actual, 'res.body').to.have.all.keys(expectedKeys);

  if (expected.id) {
    expect(actual.id, 'theme.id').to.equal(expected.id);
  } else {
    expect(actual.id, 'theme.id').to.be.a('string');
  }

  expect(actual.title, 'theme.title').to.equal(expected.title);

  expect(actual.description, 'theme.description').to.equal(expected.description);

  expect(actual.photoUrl, 'theme.photoUrl').to.equal(expected.photoUrl);

  if (expected.source) {
    expect(actual.source, 'theme.source').to.equal(expected.source);
  }

  expect(actual.createdAt, 'theme.createdAt').to.be.iso8601(...toArray(expected.createdAt));

  if (expected.updatedAt === 'createdAt') {
    expect(actual.updatedAt, 'theme.updatedAt').to.equal(actual.createdAt);
  } else {
    expect(actual.updatedAt, 'theme.updatedAt').to.be.iso8601(...toArray(expected.updatedAt));
  }

  // Check that the corresponding theme exists in the database.
  await module.exports.inDb(actual);
};

module.exports.inDb = async function(expected) {

  const theme = await checkRecord(Theme, expected.id);
  expect(theme, 'db.theme').to.be.an.instanceOf(Theme);

  expect(theme.get('api_id'), 'db.theme.api_id').to.equal(expected.id);
  expect(theme.get('id'), 'db.theme.id').to.be.a('string');
  expect(theme.get('title'), 'db.theme.title').to.equal(expected.title);
  expect(theme.get('description'), 'db.theme.description').to.equal(expected.description);
  expect(theme.get('photo_url'), 'db.theme.photo_url').to.equal(expected.photoUrl);
  expect(theme.get('source'), 'db.theme.source').to.equal(expected.source);
  expect(theme.get('created_at'), 'db.theme.created_at').to.be.sameMoment(expected.createdAt);
  expect(theme.get('updated_at'), 'db.theme.updated_at').to.be.sameMoment(expected.updatedAt);
};
