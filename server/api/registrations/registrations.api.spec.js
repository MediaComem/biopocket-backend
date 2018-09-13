const _ = require('lodash');

const allowedMethodsFor = require('../registrations/registrations.routes').allowedMethods;
const expectRegistration = require('../../spec/expectations/registration');
const { cleanDatabase, expectErrors, initSuperRest, setUp, testMethodsNotAllowed } = require('../../spec/utils');
setUp();

describe('Registrations API', () => {
  let api;
  let reqBody;
  let now;

  beforeEach(async () => {
    api = initSuperRest();
    await cleanDatabase();
  });

  describe('/api/registrations', () => {
    testMethodsNotAllowed('/registrations', allowedMethodsFor['/']);
  });

  describe('POST /api/registrations', () => {
    beforeEach(() => {
      now = new Date();
      reqBody = {
        firstname: 'Mordin',
        lastname: 'Solus',
        email: 'mordin.solus@normandy.ship'
      };
    });

    it('should require mandatory properties', async function() {
      const res = await api.create('/registrations', {}, { expectedStatus: 422 });

      expectErrors(res, [
        {
          message: 'is required',
          type: 'json',
          location: '/firstname',
          validator: 'required',
          valueSet: false
        },
        {
          message: 'is required',
          type: 'json',
          location: '/lastname',
          validator: 'required',
          valueSet: false
        },
        {
          message: 'is required',
          type: 'json',
          location: '/email',
          validator: 'required',
          valueSet: false
        }
      ]);
    });

    it('should create a registration with all properties', async function() {
      const res = await api.create('/registrations', reqBody);
      await expectRegistration(res.body, getExpectedRegistrationFromRequestBody({
        createdAt: [ 'gt', now, 500 ],
        updatedAt: 'createdAt'
      }));
    });

    /**
     * Returns an object representing the expected properties of a Registration, based on the default request body for this test block.
     *
     * @param  {...Object} changes - Additional expected changes compared to the requets body (merged with Lodash's `merge`).
     * @returns {Object} An expectation object.
     */
    function getExpectedRegistrationFromRequestBody(...changes) {
      return _.merge({}, reqBody, ...changes);
    }
  });
});
