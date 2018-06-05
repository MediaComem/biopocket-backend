const { assign } = require('lodash');

const allowedMethodsFor = require('./themes.routes').allowedMethods;
const expectTheme = require('../../spec/expectations/theme');
const themeFixtures = require('../../spec/fixtures/theme');
const { testMethodsNotAllowed } = require('../../spec/utils');
const { cleanDatabase, expectErrors, initSuperRest, setUp } = require('../../spec/utils');

setUp();

describe('Themes API', function() {

  let api;
  beforeEach(async function() {
    api = initSuperRest();
    await cleanDatabase();
  });

  describe('/api/themes/:id', function() {
    testMethodsNotAllowed('/themes/:id', allowedMethodsFor['/:id']);
  });

  describe('GET /api/themes/:id', function() {
    let theme;
    beforeEach(async function() {
      theme = await themeFixtures.theme();
    });

    it('should retrieve a theme', async function() {
      const res = await api.retrieve(`/themes/${theme.get('api_id')}`);
      await expectTheme(res.body, getExpectedTheme(theme));
    });

    it('should not retrieve a theme that does not exist', async function() {
      const res = await api.retrieve('/themes/foo', { expectedStatus: 404 });
      expectErrors(res, {
        code: 'record.notFound',
        message: 'No theme was found with ID foo.'
      });
    });
  });
});

/**
 * Returns an object representing the expected properties of an Action, based on the specified Action.
 * (Can be used, for example, to check if a returned API response matches an action in the database.)
 *
 * @param {Theme} theme - A theme record.
 * @param {...Object} changes - Additional expected changes compared to the specified theme (merged with Lodash's `assign`).
 * @returns {Object} An expectations object.
 */
function getExpectedTheme(theme, ...changes) {
  return assign({
    id: theme.get('api_id'),
    title: theme.get('title'),
    description: theme.get('description'),
    photoUrl: theme.get('photo_url'),
    source: theme.get('source') ? theme.get('source') : undefined,
    createdAt: theme.get('created_at'),
    updatedAt: theme.get('updated_at')
  }, ...changes);
}

exports.getExpectedTheme = getExpectedTheme;
