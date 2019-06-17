const moment = require('moment');

const { expectJwt } = require('../../spec/expectations/jwt');
const { expectUser, getExpectedUser } = require('../../spec/expectations/user');
const userFixtures = require('../../spec/fixtures/user');
const { cleanDatabase, expectErrors, initSuperRest, setUp, testMethodsNotAllowed } = require('../../spec/utils');

setUp();

describe('Authentication API', function() {

  let api, now, reqBody, twoDaysAgo, user;
  beforeEach(async function() {
    api = initSuperRest();
    await cleanDatabase();
    now = new Date();
    twoDaysAgo = moment().subtract(2, 'days').toDate();
  });

  describe('/api/auth', () => {
    testMethodsNotAllowed('/auth', require('../auth/auth.routes').allowedMethods['/']);
  });

  describe('POST /api/auth', () => {
    it('should require credentials', async function() {

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
          message: 'password or registration OTP is required',
          type: 'json',
          location: '',
          validator: 'auth.credentialsRequired',
          value: {},
          valueSet: true
        }
      ]);
    });

    it('should not accept multiple credential types', async function() {

      const res = this.test.res = await api.create('/auth', {
        password: 'letmein',
        registrationOtp: '123456'
      }, { expectedStatus: 422 });

      expectErrors(res, [
        {
          message: 'is required',
          type: 'json',
          location: '/email',
          validator: 'required',
          valueSet: false
        },
        {
          message: 'password and registration OTP cannot be used at the same time',
          type: 'json',
          location: '',
          validator: 'auth.credentialTypesExclusive',
          value: {
            password: 'letmein',
            registrationOtp: '123456'
          },
          valueSet: true
        }
      ]);
    });

    describe('with a password', () => {
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

        const twoWeeksFromNow = moment(now).add(2, 'weeks');
        await expectApiJwt(res.body.token, user, twoWeeksFromNow);

        await expectUser(res.body.user, getExpectedUser(user, {
          createdAt: twoDaysAgo,
          updatedAt: twoDaysAgo
        }));
      });

      it('should log in an admin', async function() {

        await user.save({ roles: [ 'admin' ] });
        const res = this.test.res = await api.create('/auth', reqBody);

        const twoWeeksFromNow = moment(now).add(2, 'weeks');
        await expectApiJwt(res.body.token, user, twoWeeksFromNow);

        await expectUser(res.body.user, getExpectedUser(user, {
          createdAt: twoDaysAgo,
          providerData: {},
          roles: [ 'admin' ],
          updatedAt: [ 'gte', now, 1000 ]
        }));
      });

      it('should generate a JWT with the default lifespan', async function() {

        reqBody.lifespan = true;
        const res = this.test.res = await api.create('/auth', reqBody);

        const twoWeeksFromNow = moment(now).add(2, 'weeks');
        await expectApiJwt(res.body.token, user, twoWeeksFromNow);

        await expectUser(res.body.user, getExpectedUser(user, {
          createdAt: twoDaysAgo,
          updatedAt: twoDaysAgo
        }));
      });

      it('should generate a JWT with a custom lifespan', async function() {

        reqBody.lifespan = 42;
        const res = this.test.res = await api.create('/auth', reqBody);

        const fortyTwoSecondsFromNow = moment(now).add(42, 'seconds');
        await expectApiJwt(res.body.token, user, fortyTwoSecondsFromNow);

        await expectUser(res.body.user, getExpectedUser(user, {
          createdAt: twoDaysAgo,
          updatedAt: twoDaysAgo
        }));
      });

      it('should generate a JWT that never expires', async function() {

        reqBody.lifespan = false;
        const res = this.test.res = await api.create('/auth', reqBody);

        await expectApiJwt(res.body.token, user, false);

        await expectUser(res.body.user, getExpectedUser(user, {
          createdAt: twoDaysAgo,
          updatedAt: twoDaysAgo
        }));
      });

      it('should not log in a non-existent user', async function() {

        reqBody.email = userFixtures.email();
        const res = this.test.res = await api.create('/auth', reqBody, { expectedStatus: 401 });

        expectErrors(res, {
          code: 'auth.invalidUser',
          message: 'This user account does not exist.'
        });
      });

      it('should not log in an inactive user', async function() {

        await user.save({ active: false });
        const res = this.test.res = await api.create('/auth', reqBody, { expectedStatus: 401 });

        expectErrors(res, {
          code: 'auth.inactiveUser',
          message: 'This user account is inactive.'
        });
      });

      it('should not log in an unregistered user', async function() {

        await user.save({
          email_verified: false,
          registration_otp: userFixtures.registrationOtp(),
          registration_otp_created_at: moment().subtract(1, 'minute').toDate()
        });

        const res = this.test.res = await api.create('/auth', reqBody, { expectedStatus: 401 });

        expectErrors(res, {
          code: 'auth.userNotRegistered',
          message: 'This user has not completed the registration process.'
        });
      });

      it('should not log in with the wrong password', async function() {

        reqBody.password = userFixtures.password();
        const res = this.test.res = await api.create('/auth', reqBody, { expectedStatus: 401 });

        expectErrors(res, {
          code: 'auth.invalidPassword',
          message: 'The password is invalid.'
        });
      });

      it('should not log in with another user\'s password', async function() {

        reqBody.password = userFixtures.password();
        await userFixtures.user({
          password: reqBody.password
        });

        const res = this.test.res = await api.create('/auth', reqBody, { expectedStatus: 401 });

        expectErrors(res, {
          code: 'auth.invalidPassword',
          message: 'The password is invalid.'
        });
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

      it('should not accept an invalid lifespan', async function() {

        reqBody.lifespan = 'foo';
        const res = this.test.res = await api.create('/auth', reqBody, { expectedStatus: 422 });

        expectErrors(res, [
          {
            message: 'lifespan must be a boolean or a whole number of seconds greater than or equal to 1',
            type: 'json',
            location: '/lifespan',
            validator: 'auth.lifespan',
            value: 'foo',
            valueSet: true
          }
        ]);
      });
    });

    describe('with a registration OTP', () => {

      let threeMinutesAgo;
      beforeEach(async () => {

        threeMinutesAgo = moment().subtract(3, 'minutes');
        const registrationOtp = userFixtures.registrationOtp();

        const password = userFixtures.password();
        user = await userFixtures.user({
          createdAt: threeMinutesAgo,
          emailVerified: false,
          password: password,
          registrationOtp,
          registrationOtpCreatedAt: threeMinutesAgo,
          updatedAt: threeMinutesAgo
        });

        reqBody = {
          email: user.get('email'),
          registrationOtp
        };
      });

      it('should generate a token with the register scope', async function() {

        const res = this.test.res = await api.create('/auth', reqBody);

        const twoWeeksFromNow = moment(now).add(2, 'weeks');
        await expectRegistrationJwt(res.body.token, user, twoWeeksFromNow);

        await expectUser(res.body.user, getExpectedUser(user, {
          createdAt: threeMinutesAgo,
          updatedAt: threeMinutesAgo
        }));
      });

      it('should not log in a non-existent user', async function() {

        reqBody.email = userFixtures.email();
        const res = this.test.res = await api.create('/auth', reqBody, { expectedStatus: 401 });

        expectErrors(res, {
          code: 'auth.invalidUser',
          message: 'This user account does not exist.'
        });
      });

      it('should not log in an inactive user', async function() {

        await user.save({ active: false });
        const res = this.test.res = await api.create('/auth', reqBody, { expectedStatus: 401 });

        expectErrors(res, {
          code: 'auth.inactiveUser',
          message: 'This user account is inactive.'
        });
      });

      it('should not log in a registered user', async function() {

        await user.save({
          email_verified: true,
          registration_otp: null,
          registration_otp_created_at: null
        });

        const res = this.test.res = await api.create('/auth', reqBody, { expectedStatus: 401 });

        expectErrors(res, {
          code: 'auth.userAlreadyRegistered',
          message: 'This user has already registered.'
        });
      });

      it('should not log in a user without a registration OTP', async function() {

        await user.save({
          registration_otp: null
        });

        const res = this.test.res = await api.create('/auth', reqBody, { expectedStatus: 401 });

        expectErrors(res, {
          code: 'auth.registrationOtpUnavailable',
          message: 'This user has no registration OTP.'
        });
      });

      it('should not log in a user without a registration OTP creation date', async function() {

        await user.save({
          registration_otp_created_at: null
        });

        const res = this.test.res = await api.create('/auth', reqBody, { expectedStatus: 401 });

        expectErrors(res, {
          code: 'auth.registrationOtpUnavailable',
          message: 'This user has no registration OTP.'
        });
      });

      it('should not log in a user with the wrong OTP', async function() {

        reqBody.registrationOtp = userFixtures.registrationOtp();
        const res = this.test.res = await api.create('/auth', reqBody, { expectedStatus: 401 });

        expectErrors(res, {
          code: 'auth.invalidRegistrationOtp',
          message: 'The registration OTP is invalid.'
        });
      });

      it('should not log in with another user\'s OTP', async function() {

        reqBody.registrationOtp = userFixtures.registrationOtp();

        await userFixtures.user({
          createdAt: threeMinutesAgo,
          emailVerified: false,
          password: userFixtures.password(),
          registrationOtp: reqBody.registrationOtp,
          registrationOtpCreatedAt: threeMinutesAgo,
          updatedAt: threeMinutesAgo
        });

        const res = this.test.res = await api.create('/auth', reqBody, { expectedStatus: 401 });

        expectErrors(res, {
          code: 'auth.invalidRegistrationOtp',
          message: 'The registration OTP is invalid.'
        });
      });

      it('should not log in a user with an expired OTP', async function() {

        await user.save({
          registration_otp_created_at: moment().subtract(3, 'hours').toDate()
        });

        const res = this.test.res = await api.create('/auth', reqBody, { expectedStatus: 401 });

        expectErrors(res, {
          code: 'auth.expiredRegistrationOtp',
          message: 'This registration OTP has expired.'
        });
      });

      it('should not log in with invalid credentials', async function() {

        reqBody.email = 'foo';
        reqBody.registrationOtp = '   ';
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
            location: '/registrationOtp',
            validator: 'notBlank',
            value: '   ',
            valueSet: true
          }
        ]);
      });
    });
  });

  /**
   * Asserts that the specified JWT is for the specified user and has the "api" scope.
   *
   * @param {string} token - The JWT to verify.
   * @param {User} tokenUser - The user the JWT should be for.
   * @param {number|Date|Moment} expiration - The expected approximate expiration date of the JWT (within one second).
   * @param {number|Date|Moment} [issuedAt] - The expected approximate issue date of the JWT (within one second).
   */
  async function expectApiJwt(token, tokenUser, expiration, issuedAt = now) {
    await expectJwt(token, {
      exp: expectation => {
        // Assert that the JWT token expires after a given date or never expires.
        return expiration ? expectation.timestampCloseAfter(expiration) : expectation.equal(undefined);
      },
      iat: expectation => expectation.timestampCloseAfter(issuedAt),
      sub: tokenUser.get('api_id')
    });
  }

  /**
   * Asserts that the specified JWT is for the specified user and has the "register" scope.
   *
   * @param {string} token - The JWT to verify.
   * @param {User} tokenUser - The user the JWT should be for.
   * @param {number|Date|Moment} expiration - The expected approximate expiration date of the JWT (within one second).
   * @param {number|Date|Moment} [issuedAt] - The expected approximate issue date of the JWT (within one second).
   */
  async function expectRegistrationJwt(token, tokenUser, expiration, issuedAt = now) {
    await expectJwt(token, {
      exp: expectation => expectation.timestampCloseAfter(expiration),
      iat: expectation => expectation.timestampCloseAfter(issuedAt),
      scope: [ 'register' ],
      sub: tokenUser.get('api_id')
    });
  }
});
