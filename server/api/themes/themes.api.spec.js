const allowedMethodsFor = require('./themes.routes').allowedMethods;
const expectTheme = require('../../spec/expectations/theme');
const themeFixtures = require('../../spec/fixtures/theme');
const { testMethodsNotAllowed } = require('../../spec/utils');
const { cleanDatabase, expectErrors, getExpectedTheme, initSuperRest, setUp } = require('../../spec/utils');

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
