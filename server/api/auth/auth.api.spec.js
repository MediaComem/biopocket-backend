const crypto = require('crypto');
const _ = require('lodash');
const moment = require('moment');

const app = require('../../app');
const config = require('../../../config');
const User = require('../../models/user');
const expectUser = require('../../spec/expectations/user');
const userFixtures = require('../../spec/fixtures/user');
const { cleanDatabase, expect, initSuperRest, setUp } = require('../../spec/utils');

setUp();

describe('Authentication API', function() {

  let api, now, reqBody, user;
  beforeEach(async function() {
    api = initSuperRest();
    await cleanDatabase();
    now = new Date();
  });

  describe('POST /api/auth', () => {
    beforeEach(async () => {

      const password = userFixtures.password();
      user = await userFixtures.user({
        password: password
      });

      reqBody = {
        email: user.get('email'),
        password: password
      };
    });

    it('should log in the user', async function() {
      const res = this.test.res = await api.create('/auth', reqBody);
      expect(res.body.token).to.be.a('string');
      expectUser(res.body.user, getExpectedUser({
        createdAt: [ 'gte', now, 1000 ],
        updatedAt: 'createdAt'
      }));
    });

    function getExpectedUser(...properties) {
      return _.extend({}, reqBody, ...properties);
    }
  });
});
