const crypto = require('crypto');
const _ = require('lodash');
const moment = require('moment');

const app = require('../../app');
const config = require('../../../config');
const User = require('../../models/user');
const expectUser = require('../../spec/expectations/user');
const userFixtures = require('../../spec/fixtures/user');
const { cleanDatabase, expect, expectErrors, initSuperRest, setUp } = require('../../spec/utils');

setUp();

describe('Authentication API', function() {

  let api, now, reqBody, twoDaysAgo, user;
  beforeEach(async function() {
    api = initSuperRest();
    await cleanDatabase();
    now = new Date();
    twoDaysAgo = moment().subtract(2, 'days').toDate();
  });

  describe('POST /api/auth', () => {
    beforeEach(async () => {

      const password = userFixtures.password();
      user = await userFixtures.user({
        createdAt: twoDaysAgo,
        password: password,
        updatedAt: twoDaysAgo
      });

      reqBody = {
        email: user.get('email'),
        password: password
      };
    });

    it('should log in a user', async function() {
      const res = this.test.res = await api.create('/auth', reqBody);

      expect(res.body.token).to.be.a('string');
      expectUser(res.body.user, getExpectedUser({
        createdAt: twoDaysAgo,
        updatedAt: twoDaysAgo
      }));
    });

    it('should log in an admin', async function() {
      await user.save({ roles: [ 'admin' ] });
      const res = this.test.res = await api.create('/auth', reqBody);

      expect(res.body.token).to.be.a('string');
      expectUser(res.body.user, getExpectedUser({
        createdAt: twoDaysAgo,
        roles: [ 'admin' ],
        updatedAt: [ 'gte', now, 1000 ]
      }));
    });

    it('should not log in a non-existent user', async function() {
      reqBody.email = userFixtures.email();
      const res = this.test.res = await api.create('/auth', reqBody, { expectedStatus: 401 });

      expectErrors(res, {
        code: 'auth.invalidUser',
        message: 'This user account does not exist or is inactive.'
      });
    });

    it('should not log in an inactive user', async function() {
      await user.save({ active: false });
      const res = this.test.res = await api.create('/auth', reqBody, { expectedStatus: 401 });

      expectErrors(res, {
        code: 'auth.invalidUser',
        message: 'This user account does not exist or is inactive.'
      });
    });

    it('should not log in with the wrong password', async function() {
      reqBody.password = userFixtures.password();
      const res = this.test.res = await api.create('/auth', reqBody, { expectedStatus: 401 });

      expectErrors(res, {
        code: 'auth.invalidCredentials',
        message: 'The password is invalid.'
      });
    });

    it('should not log in with no credentials', async function() {
      const res = this.test.res = await api.create('/auth', {}, { expectedStatus: 422 });

      expectErrors(res, [
        {
          message: 'is required',
          type: 'json',
          location: '/email',
          validator: 'required',
          valueSet: false
        },
        {
          message: 'is required',
          type: 'json',
          location: '/password',
          validator: 'required',
          valueSet: false
        }
      ]);
    });

    it('should not log in with invalid credentials', async function() {
      reqBody.email = 'foo';
      reqBody.password = '   ';
      const res = this.test.res = await api.create('/auth', reqBody, { expectedStatus: 422 });

      expectErrors(res, [
        {
          message: 'must be a valid e-mail address',
          type: 'json',
          location: '/email',
          validator: 'email',
          value: 'foo',
          valueSet: true
        },
        {
          message: 'must not be blank',
          type: 'json',
          location: '/password',
          validator: 'notBlank',
          value: '   ',
          valueSet: true
        }
      ]);
    });

    function getExpectedUser(...properties) {
      return _.extend({}, reqBody, ...properties);
    }
  });
});
