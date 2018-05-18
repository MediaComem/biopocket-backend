const _ = require('lodash');
const moment = require('moment');

const User = require('../../models/user');
const expectUser = require('../../spec/expectations/user');
const userFixtures = require('../../spec/fixtures/user');
const { cleanDatabase, expect, expectErrors, initSuperRest, setUp, expectMethodsNotAllowed } = require('../../spec/utils');

setUp();

describe('Users API', function() {

  let api, reqBody, twoDaysAgo;
  beforeEach(async function() {
    api = initSuperRest();
    await cleanDatabase();
    twoDaysAgo = moment().subtract(2, 'days').toDate();
  });

  describe('/api/users/:id', function() {
    expectMethodsNotAllowed('/users/:id', require('../users/users.routes').allowedMethods['/:id']);
  });

  describe('GET /api/users/:id', function() {

    let user;
    beforeEach(async () => {
      user = await userFixtures.user({
        createdAt: twoDaysAgo,
        updatedAt: twoDaysAgo
      });
    });

    it('should deny anonymous access', async function() {

      const res = this.test.res = await api.retrieve(`/users/${user.get('api_id')}`, { expectedStatus: 401 });

      expectErrors(res, {
        code: 'auth.missingAuthorization',
        message: 'Authentication is required to access this resource. Authenticate by providing a Bearer token in the Authorization header.'
      });
    });

    describe('as a user', function() {
      it('should retrieve the user', async function() {

        const res = this.test.res = await api
          .retrieve(`/users/${user.get('api_id')}`)
          .set('Authorization', `Bearer ${user.generateJwt()}`);

        await expectUser(res.body, getExpectedUser(user));
      });

      it('should not retrieve another user', async function() {

        const anotherUser = await userFixtures.user();
        const res = this.test.res = await api
          .retrieve(`/users/${anotherUser.get('api_id')}`, { expectedStatus: 404 })
          .set('Authorization', `Bearer ${user.generateJwt()}`);

        expectErrors(res, {
          code: 'record.notFound',
          message: `No user was found with ID ${anotherUser.get('api_id')}.`
        });
      });

      it('should not retrieve a non-existent user', async function() {

        const res = this.test.res = await api
          .retrieve(`/users/foo`, { expectedStatus: 404 })
          .set('Authorization', `Bearer ${user.generateJwt()}`);

        expectErrors(res, {
          code: 'record.notFound',
          message: 'No user was found with ID foo.'
        });
      });
    });

    describe('as an admin', async function() {

      let admin;
      beforeEach(async () => {
        admin = await userFixtures.admin({
          createdAt: twoDaysAgo,
          updatedAt: twoDaysAgo
        });
      });

      it('should retrieve the admin', async function() {

        const res = this.test.res = await api
          .retrieve(`/users/${admin.get('api_id')}`)
          .set('Authorization', `Bearer ${admin.generateJwt()}`);

        await expectUser(res.body, getExpectedUser(admin));
      });

      it('should retrieve another user', async function() {

        const res = this.test.res = await api
          .retrieve(`/users/${user.get('api_id')}`)
          .set('Authorization', `Bearer ${admin.generateJwt()}`);

        await expectUser(res.body, getExpectedUser(user));
      });

      it('should not retrieve a non-existent user', async function() {

        const res = this.test.res = await api
          .retrieve(`/users/foo`, { expectedStatus: 404 })
          .set('Authorization', `Bearer ${admin.generateJwt()}`);

        expectErrors(res, {
          code: 'record.notFound',
          message: 'No user was found with ID foo.'
        });
      });
    });
  });

  describe('/api/me', function() {
    expectMethodsNotAllowed('/me', require('../users/users.me.routes').allowedMethods['/']);
  });

  describe('GET /api/me', function() {

    let user;
    beforeEach(async () => {
      user = await userFixtures.user({
        createdAt: twoDaysAgo,
        updatedAt: twoDaysAgo
      });
    });

    it('should deny anonymous access', async function() {

      const res = this.test.res = await api.retrieve('/me', { expectedStatus: 401 });

      expectErrors(res, {
        code: 'auth.missingAuthorization',
        message: 'Authentication is required to access this resource. Authenticate by providing a Bearer token in the Authorization header.'
      });
    });

    describe('as a user', function() {
      it('should retrieve the user', async function() {

        const res = this.test.res = await api
          .retrieve('/me')
          .set('Authorization', `Bearer ${user.generateJwt()}`);

        await expectUser(res.body, getExpectedUser(user));
      });
    });

    describe('as an admin', async function() {
      beforeEach(async function() {
        await user.save({ roles: [ 'admin' ] });
      });

      it('should retrieve the user', async function() {

        const res = this.test.res = await api
          .retrieve('/me')
          .set('Authorization', `Bearer ${user.generateJwt()}`);

        await expectUser(res.body, getExpectedUser(user));
      });
    });
  });

  function getExpectedUser(user, ...changes) {
    return _.extend({
      active: user.get('active'),
      createdAt: user.get('created_at'),
      id: user.get('api_id'),
      email: user.get('email'),
      roles: user.get('roles'),
      updatedAt: user.get('updated_at')
    }, ...changes);
  }
});
