const crypto = require('crypto');
const expect = require('chai').expect;
const _ = require('lodash');
const moment = require('moment');

const app = require('../../app');
const config = require('../../../config');
const User = require('../../models/user');
const expectUser = require('../../spec/expectations/user');
const userFixtures = require('../../spec/fixtures/user');
const { cleanDatabase, setUp } = require('../../spec/utils');

setUp();

describe('Authentication API', function() {

  let data;
  beforeEach(async () => {
    data = {};
    await cleanDatabase();
  });

  describe('POST /api/auth', () => {
    beforeEach(async () => {

      const password = userFixtures.password();
      data.user = await userFixtures.user({
        password: password
      });

      data.reqBody = {
        email: data.user.get('email'),
        password: password
      };
    });

    it('should log in the user', async () => {
      const res = await require('supertest')(app).post('/api/auth').send(data.reqBody)
      expect(res.status).to.equal(201);
      expect(res.body.token).to.be.a('string');
      expectUser(res.body.user, data.reqBody);
    });
  });
});
