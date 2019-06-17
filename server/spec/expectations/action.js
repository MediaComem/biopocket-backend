const { assign, union } = require('lodash');

const config = require('../../../config');
const Action = require('../../models/action');
const { checkRecord, expect } = require('../utils');
const { toArray } = require('../utils/conversion');

/**
 * Asserts that an action response from the API has the expected properties,
 * then asserts that an equivalent action exists in the database.
 *
 * @param {Object} actual - The action to check.
 * @param {Object} expected - Expected action properties.
 * @param {Object} [options] - Custom options.
 * @param {string[]} [options.additionalKeys] - Additional properties the action is expected to have.
 */
exports.expectAction = async function(actual, expected, options = {}) {

  expect(actual, 'res.body').to.be.an('object');

  let expectedKeys = [ 'id', 'title', 'description', 'impact', 'photoUrl', 'themeId', 'createdAt', 'updatedAt' ];

  // TODO: check the theme object is correct as well
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

  expect(actual.impact, 'action.impact').to.equal(expected.impact);

  expect(actual.photoUrl, 'action.photoUrl').to.equal(expected.photoUrl);
  expect(actual.photoUrl).to.startWith(config.imagesBaseUrl);

  expect(actual.themeId, 'action.themeId').to.be.equal(expected.themeId);

  expect(actual.createdAt, 'action.createdAt').to.be.iso8601(...toArray(expected.createdAt));

  if (expected.updatedAt === 'createdAt') {
    expect(actual.updatedAt, 'action.updatedAt').to.equal(actual.createdAt);
  } else {
    expect(actual.updatedAt, 'action.updatedAt').to.be.iso8601(...toArray(expected.updatedAt));
  }

  // Check that the corresponding action exists in the database.
  await exports.expectActionInDb(actual);
};

/**
 * Asserts that an action exists in the database with the specified properties.
 *
 * Note that database columns are underscored while expected properties are
 * camel-cased. This allows calling this method with an API response in JSON.
 *
 * @param {Object} expected - The action that is expected to be in the database.
 */
exports.expectActionInDb = async function(expected) {

  const action = await checkRecord(Action, expected.id);
  await action.load('theme');

  expect(action, 'db.action').to.be.an.instanceof(Action);

  expect(action.get('api_id'), 'db.action.api_id').to.equal(expected.id);
  expect(action.get('id'), 'db.action.id').to.be.a('string');
  expect(action.get('title', 'db.action.title')).to.equal(expected.title);
  expect(action.get('description', 'db.action.description')).to.equal(expected.description);
  expect(action.get('impact', 'db.action.impact')).to.equal(expected.impact);
  expect(action.related('theme').get('api_id'), 'db.action.theme_id').to.equal(expected.themeId);
  expect(action.get('created_at'), 'db.action.created_at').to.be.sameMoment(expected.createdAt);
  expect(action.get('updated_at'), 'db.action.updated_at').to.be.sameMoment(expected.updatedAt);

  // Deconstruct the image URL to retrieve the code.
  const expectedCode = expected.photoUrl.slice(config.imagesBaseUrl.length).replace(/^\//, '').replace(/-main\.jpg$/, '');
  expect(action.get('code'), 'db.action.code').to.equal(expectedCode);
};

/**
 * Returns an object representing the expected properties of an Action, based on the specified Action.
 * (Can be used, for example, to check if a returned API response matches an action in the database.)
 *
 * @param {action} action - The action to build the expectation from.
 * @param {...Object} changes - Additional expected changes compared to the specified action (merged with Lodash's `assign`).
 * @returns {Object} An expectations object.
 **/
exports.getExpectedAction = function(action, ...changes) {
  return assign({
    id: action.get('api_id'),
    title: action.get('title'),
    description: action.get('description'),
    impact: action.get('impact'),
    photoUrl: `${config.imagesBaseUrl}/${action.get('code')}-main.jpg`,
    themeId: action.related('theme').get('api_id'),
    createdAt: action.get('created_at'),
    updatedAt: action.get('updated_at')
  }, ...changes);
};
