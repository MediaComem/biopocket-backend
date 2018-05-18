const { union } = require('lodash');

const Action = require('../../models/action');
const { checkRecord, expect, toArray } = require('../utils');

/**
 * Executes a series of expectations on a given Action record.
 * Some of these expectations compare the Action record to an expected record.
 * Finally, the Action record is compared to the record in the database.
 * You can pass custom options to customize the expectation.
 *
 * @param {Action} actual - An action record to test.
 * @param {Action} expected - The expected action record.
 * @param {Object} [options] - Custom options.
 * @param {array} [options.additionalKeys] - Additional keys that the action record should have.
 */
module.exports = async function(actual, expected, options = {}) {

  expect(actual, 'res.body').to.be.an('object');

  let expectedKeys = [ 'id', 'title', 'description', 'themeId', 'createdAt', 'updatedAt' ];

  if (options.additionalKeys) {
    expectedKeys = union(expectedKeys, options.additionalKeys);
  }

  expect(actual, 'res.body').to.have.all.keys(expectedKeys);

  if (expected.id) {
    expect(actual.id, 'action.id').to.equal(expected.id);
  } else {
    expect(actual.id, 'action.id').to.be.a('string');
  }

  expect(actual.title, 'action.title').to.equal(expected.title);

  expect(actual.description, 'action.description').to.equal(expected.description);

  expect(actual.themeId, 'action.themeId').to.be.equal(expected.themeId);

  expect(actual.createdAt, 'action.createdAt').to.be.iso8601(...toArray(expected.createdAt));

  if (expected.updatedAt === 'createdAt') {
    expect(actual.updatedAt, 'action.updatedAt').to.equal(actual.createdAt);
  } else {
    expect(actual.updatedAt, 'action.updatedAt').to.be.iso8601(...toArray(expected.updatedAt));
  }

  // Check that the corresponding action exists in the database.
  await module.exports.inDb(actual);
};

module.exports.inDb = async function(expected) {

  const action = await checkRecord(Action, expected.id);
  await action.load('theme');

  expect(action, 'db.action').to.be.an.instanceof(Action);

  expect(action.get('api_id'), 'db.action.api_id').to.equal(expected.id);
  expect(action.get('id'), 'db.action.id').to.be.a('string');
  expect(action.get('title', 'db.action.title')).to.equal(expected.title);
  expect(action.get('description', 'db.action.description')).to.equal(expected.description);
  expect(action.related('theme').get('api_id'), 'db.action.theme_id').to.equal(expected.themeId);
  expect(action.get('created_at'), 'db.action.created_at').to.be.sameMoment(expected.createdAt);
  expect(action.get('updated_at'), 'db.action.updated_at').to.be.sameMoment(expected.updatedAt);
};
