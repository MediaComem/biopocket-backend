const _ = require('lodash');

const allowedMethodsFor = require('../actions/actions.routes').allowedMethods;
const expectActions = require('../../spec/expectations/action');
const actionFixtures = require('../../spec/fixtures/actions');
const { cleanDatabase, expect, expectErrors, initSuperRest, setUp, testMethodsNotAllowed } = require('../../spec/utils');
const { getExpectedTheme } = require('../themes/themes.api.spec');

setUp();

describe('Actions API', function() {

  let api;

  beforeEach(async function() {
    api = initSuperRest();
    await cleanDatabase();
  });

  describe('/api/actions', function() {
    testMethodsNotAllowed('/actions', allowedMethodsFor['/']);
  });

  describe('GET /api/actions', function() {
    it('should list no actions', async function() {
      const res = await api.retrieve('/actions');
      expect(res.body).to.eql([]);
    });

    describe('with actions', function() {

      let actions;

      beforeEach(async function() {
        actions = await Promise.all([
          actionFixtures.action({ title: 'Action A - Do that' }),
          actionFixtures.action({ title: 'Action C - Do this' }),
          actionFixtures.action({ title: 'Action B - Do something !' }),
          actionFixtures.action({ title: 'Action D - The forgotten' })
        ]);
      });

      it('should list all actions ordered by title', async function() {
        const res = await api.retrieve('/actions');
        expect(res.body).to.be.an('array');
        await expectActions(res.body[0], getExpectedAction(actions[0]));
        await expectActions(res.body[1], getExpectedAction(actions[2]));
        await expectActions(res.body[2], getExpectedAction(actions[1]));
        expect(res.body).to.have.length(3);
      });

      it('should not accept an include query parameter value that does not exist for an action', async function() {
        const res = await api.retrieve('/actions', { expectedStatus: 400 }).query({ include: 'book' });

        expectErrors(res, [
          {
            message: 'must be one of theme',
            type: 'query',
            location: 'include',
            validator: 'inclusion',
            allowedValues: [ 'theme' ],
            allowedValuesDescription: 'theme',
            value: 'book',
            valueSet: true
          }
        ]);
      });

      it('should include the requested resources based on the include query parameter value', async function() {
        const res = await api.retrieve('/actions').query({ include: 'theme' });
        expect(res.body).to.be.an('array');
        res.body.forEach(action => {
          expect(action.theme).to.be.an('object');
          // TODO : test the entire theme object with the `expectTheme` expectation function.
          expect(action.theme.id).to.equal(action.themeId);
        });
      });

      // TODO : Remember to extract this test suite in its own function, much like testAllowedMethods.
      describe('and pagination', function() {

        it('should use the default pagination configuration', async function() {
          const res = await api.retrieve('/actions');

          expect(res.body).to.be.an('array');
          expect(res.body).to.have.length(3);
          expect(res.headers['pagination-total']).to.equal('4');
          expect(res.headers['pagination-limit']).to.equal('3');
          expect(res.headers['pagination-offset']).to.equal('0');
        });

        it('should paginate according to query parameters', async function() {
          const res = await api.retrieve('/actions').query({
            limit: 2,
            offset: 1
          });

          expect(res.body).to.be.an('array');
          expect(res.body).to.have.length(2);
          expect(res.headers['pagination-total']).to.equal('4');
          expect(res.headers['pagination-limit']).to.equal('2');
          expect(res.headers['pagination-offset']).to.equal('1');
        });
      });
    });
  });

  describe('/api/actions/:id', function() {
    testMethodsNotAllowed('/actions/1', allowedMethodsFor['/:id']);
  });

  describe('GET /api/actions/:id', function() {
    let action, theme;
    beforeEach(async function() {
      action = await actionFixtures.action();
      await action.load('theme');
      theme = getExpectedTheme(action.related('theme'));
    });

    it('should retrieve an action with all its relations', async function() {
      const res = await api.retrieve(`/actions/${action.get('api_id')}`);
      expectActions(res.body, getExpectedAction(action, { theme: theme }), {
        additionalKeys: [ 'theme' ]
      });
      expect(res.body.theme).to.eql(theme);
    });

    it('should retrieve an action without the specified relations', async function() {
      const res = await api.retrieve(`/actions/${action.get('api_id')}`).query({ except: 'theme' });
      expectActions(res.body, getExpectedAction(action));
      expect(res.body.theme).to.equal(undefined);
    });

    it('should not retrieve an action that does not exist', async function() {
      const res = await api.retrieve('/actions/foo', { expectedStatus: 404 });
      expectErrors(res, {
        code: 'record.notFound',
        message: 'No action was found with ID foo.'
      });
    });
  });
});

/**
 * Returns an object representing the expected properties of an Action, based on the specified Action.
 * (Can be used, for example, to check if a returned API response matches an action in the database.)
 *
 * @param {action} action - The action to build the expectation from.
 * @param {...Object} changes - Additional expected changes compared to the specified action (merged with Lodash's `assign`).
 * @returns {Object} An expectations object.
 **/
function getExpectedAction(action, ...changes) {
  return _.assign({
    id: action.get('api_id'),
    title: action.get('title'),
    description: action.get('description'),
    themeId: action.related('theme').get('api_id'),
    createdAt: action.get('created_at'),
    updatedAt: action.get('updated_at')
  }, ...changes);
}
