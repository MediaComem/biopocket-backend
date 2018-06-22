const { assign, escapeRegExp, has } = require('lodash');

const config = require('../../../config');
const Theme = require('../../models/theme');
const { checkRecord, expect } = require('../utils');
const { toArray } = require('../utils/conversion');

/**
 * Asserts that a theme response from the API has the expected properties, then
 * asserts that an equivalent theme exists in the database.
 *
 * @param {Object} actual - The theme to check.
 * @param {Object} expected - Expected theme properties.
 */
exports.expectTheme = async function(actual, expected) {
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
  expect(actual.photoUrl).to.startWith(config.imagesBaseUrl);

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
  await exports.expectThemeInDb(actual);
};

/**
 * Asserts that a theme exists in the database with the specified properties.
 *
 * Note that database columns are underscored while expected properties are
 * camel-cased. This allows calling this method with an API response in JSON.
 *
 * @param {Object} expected - The theme that is expected to be in the database.
 */
exports.expectThemeInDb = async function(expected) {

  const theme = await checkRecord(Theme, expected.id);
  expect(theme, 'db.theme').to.be.an.instanceOf(Theme);

  expect(theme.get('api_id'), 'db.theme.api_id').to.equal(expected.id);
  expect(theme.get('id'), 'db.theme.id').to.be.a('string');
  expect(theme.get('title'), 'db.theme.title').to.equal(expected.title);
  expect(theme.get('source'), 'db.theme.source').to.equal(expected.source);
  expect(theme.get('created_at'), 'db.theme.created_at').to.be.sameMoment(expected.createdAt);
  expect(theme.get('updated_at'), 'db.theme.updated_at').to.be.sameMoment(expected.updatedAt);

  // The markdown description in the database should not contain the base URL
  // for images, which is added at serialization by the API.
  const expectedDescription = expected.description.replace(new RegExp(escapeRegExp(`${config.imagesBaseUrl}/`), 'g'), '');
  expect(theme.get('description'), 'db.theme.description').to.equal(expectedDescription);

  // Deconstruct the image URL to retrieve the code.
  const expectedCode = expected.photoUrl.slice(config.imagesBaseUrl.length).replace(/^\//, '').replace(/-main\.jpg$/, '');
  expect(theme.get('code'), 'db.theme.code').to.equal(expectedCode);
};

/**
 * Returns an object representing the expected properties of an Action, based on the specified Action.
 * (Can be used, for example, to check if a returned API response matches an action in the database.)
 *
 * @param {Theme} theme - A theme record.
 * @param {...Object} changes - Additional expected changes compared to the specified theme (merged with Lodash's `assign`).
 * @returns {Object} An expectations object.
 */
exports.getExpectedTheme = function(theme, ...changes) {
  return assign({
    id: theme.get('api_id'),
    title: theme.get('title'),
    description: theme.get('description'),
    photoUrl: `${config.imagesBaseUrl}/${theme.get('code')}-main.jpg`,
    source: theme.get('source') ? theme.get('source') : undefined,
    createdAt: theme.get('created_at'),
    updatedAt: theme.get('updated_at')
  }, ...changes);
};
