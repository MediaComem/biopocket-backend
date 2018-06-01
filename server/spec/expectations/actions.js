const Action = require('../../models/action');
const { checkRecord, expect, toArray } = require('../utils');

module.exports = function(actual, expected) {

  expect(actual, 'res.body').to.be.an('object');

  const expectedKeys = [ 'id', 'title', 'description', 'themeId', 'createdAt', 'updatedAt' ];

  expect(actual, 'res.body').to.have.all.keys(expectedKeys);

  if (expected.id) {
    expect(actual.id, 'action.id').to.equal(expected.id);
  } else {
    expect(actual.id, 'action.id').to.be.a('string');
  }

  expect(actual.title, 'action.title').to.equal(expected.title);

  expect(actual.description, 'action.description').to.equal(expected.description);

  expect(actual.themeId, 'action.themeId').to.be.a('string');

  expect(actual.createdAt, 'action.createdAt').to.be.iso8601(...toArray(expected.createdAt));

  if (expected.updatedAt === 'createdAt') {
    expect(actual.updatedAt, 'action.updatedAt').to.equal(actual.createdAt);
  } else {
    expect(actual.updatedAt, 'action.updatedAt').to.be.iso8601(...toArray(expected.updatedAt));
  }

  // Check that the corresponding action exists in the database.
  return module.exports.inDb(actual);
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
