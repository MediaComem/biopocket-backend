const { compile: compileHandlebars } = require('handlebars');
const { escapeRegExp, extend } = require('lodash');
const moment = require('moment');
const { parse: parseQueryString } = require('query-string');
const { URL } = require('url');

const config = require('../../../config');
const { expectEmailSent, expectNoEmailsSent } = require('../../spec/expectations/emails');
const { expectUser, getExpectedUser } = require('../../spec/expectations/user');
const { req: reqFixture } = require('../../spec/fixtures/express');
const userFixtures = require('../../spec/fixtures/user');
const { clean, expect, expectErrors, initSuperRest, setUp, testMethodsNotAllowed } = require('../../spec/utils');
const { loadFileWithFrontmatter } = require('../../utils/frontmatter');
const { createRegistrationLink, sendRegistrationEmail } = require('./users.api');
const { allowedMethods } = require('./users.routes');

setUp();

describe('Users API', function() {

  let api, now, twoDaysAgo;
  beforeEach(async function() {
    api = initSuperRest();
    await clean();
    twoDaysAgo = moment().subtract(2, 'days').toDate();
  });

  describe('/api/users', function() {
    testMethodsNotAllowed('/users', allowedMethods['/']);
  });

  describe('/api/users/:id', function() {
    testMethodsNotAllowed('/users/:id', allowedMethods['/:id']);
  });

  describe('POST /api/users', function() {

    let registrationEmailSubject, registrationEmailTemplate, reqBody;
    beforeEach(async function() {

      reqBody = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        password: 'letmein'
      };

      now = new Date();

      const { contents, frontmatter } = await loadFileWithFrontmatter(config.path('server/emails/registration/fr.txt'));
      registrationEmailSubject = frontmatter.subject;
      registrationEmailTemplate = compileHandlebars(contents);
    });

    it('should register a user and send the registration email', async function() {

      const res = this.test.res = await api
        .create('/users', reqBody);

      const registeredUser = await expectUser(res.body, getExpectedUserFromRequestBody({
        providerId: reqBody.email.toLowerCase(),
        createdAt: [ 'gt', now, 500 ],
        updatedAt: 'createdAt',
        db: {
          registrationOtp: true,
          registrationOtpCreatedAt: [ 'gt', now, 500 ]
        }
      }));

      expectRegistrationEmailSent(registeredUser);
    });

    it('should lowercase the provider ID', async function() {

      reqBody.email = 'FOO@eXaMpLe.com';

      const res = this.test.res = await api
        .create('/users', reqBody);

      const registeredUser = await expectUser(res.body, getExpectedUserFromRequestBody({
        providerId: 'foo@example.com',
        createdAt: [ 'gt', now, 500 ],
        updatedAt: 'createdAt',
        db: {
          registrationOtp: true,
          registrationOtpCreatedAt: [ 'gt', now, 500 ]
        }
      }));

      expectRegistrationEmailSent(registeredUser);
    });

    it('should require mandatory properties', async function() {

      const res = this.test.res = await api
        .create('/users', {}, { expectedStatus: 422 });

      expectErrors(res, [
        {
          message: 'is required',
          type: 'json',
          location: '/firstName',
          validator: 'required',
          valueSet: false
        },
        {
          message: 'is required',
          type: 'json',
          location: '/lastName',
          validator: 'required',
          valueSet: false
        },
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

      expectNoEmailsSent();
    });

    it('should not accept invalid properties', async function() {

      reqBody.firstName = '';
      reqBody.lastName = 'Doe'.repeat(11);
      reqBody.email = 'foo';
      reqBody.password = '  ';

      const res = this.test.res = await api
        .create('/users', reqBody, { expectedStatus: 422 });

      expectErrors(res, [
        {
          message: 'must not be blank',
          type: 'json',
          location: '/firstName',
          validator: 'notBlank',
          value: '',
          valueSet: true
        },
        {
          message: 'must be a string between 1 and 30 characters long (the supplied string is too long: 33 characters long)',
          type: 'json',
          location: '/lastName',
          validator: 'string',
          validation: 'between',
          minLength: 1,
          maxLength: 30,
          actualLength: 33,
          cause: 'tooLong',
          value: 'DoeDoeDoeDoeDoeDoeDoeDoeDoeDoeDoe',
          valueSet: true
        },
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
          value: '  ',
          valueSet: true
        }
      ]);

      expectNoEmailsSent();
    });

    it('should not register a user with an email that is already taken', async function() {

      const otherUser = await userFixtures.user();
      reqBody.email = otherUser.get('email');

      const res = this.test.res = await api
        .create('/users', reqBody, { expectedStatus: 422 });

      expectErrors(res, [
        {
          message: 'is already taken',
          type: 'json',
          location: '/email',
          validator: 'user.emailAvailable',
          value: reqBody.email,
          valueSet: true
        }
      ]);

      expectNoEmailsSent();
    });

    it('should allow registering a user with an email that is already taken in an outdated registration', async function() {

      const oneYearAgo = moment().subtract(1, 'year');
      const outdatedUser = await userFixtures.user({
        createdAt: oneYearAgo,
        emailVerified: false,
        emailVerifiedAt: null,
        registrationOtp: '1234567',
        registrationOtpCreatedAt: oneYearAgo
      });

      reqBody.email = outdatedUser.get('email');

      const res = this.test.res = await api
        .create('/users', reqBody);

      const registeredUser = await expectUser(res.body, getExpectedUserFromRequestBody({
        providerId: reqBody.email.toLowerCase(),
        createdAt: [ 'gt', now, 500 ],
        updatedAt: 'createdAt',
        db: {
          registrationOtp: true,
          registrationOtpCreatedAt: [ 'gt', now, 500 ]
        }
      }));

      expectRegistrationEmailSent(registeredUser);

      // Make sure that even though the email is the same, the outdated user
      // was deleted and a new user was persisted.
      expect(registeredUser.get('id')).not.to.eql(outdatedUser.get('id'));
      expect(registeredUser.get('api_id')).not.to.eql(outdatedUser.get('api_id'));
      expect(registeredUser.get('email')).to.eql(outdatedUser.get('email'));
      expect(registeredUser.get('provider_id')).to.eql(outdatedUser.get('provider_id'));
    });

    it('should let an authenticated user register a new user', async function() {

      const user = await userFixtures.user();

      const res = this.test.res = await api
        .create('/users', reqBody)
        .set('Authorization', `Bearer ${await user.generateJwt()}`);

      const registeredUser = await expectUser(res.body, getExpectedUserFromRequestBody({
        providerId: reqBody.email.toLowerCase(),
        createdAt: [ 'gt', now, 500 ],
        updatedAt: 'createdAt',
        db: {
          registrationOtp: true,
          registrationOtpCreatedAt: [ 'gt', now, 500 ]
        }
      }));

      expectRegistrationEmailSent(registeredUser);
    });

    it('should let an authenticated administrator register a new user', async function() {

      const admin = await userFixtures.admin();

      const res = this.test.res = await api
        .create('/users', reqBody)
        .set('Authorization', `Bearer ${await admin.generateJwt()}`);

      const registeredUser = await expectUser(res.body, getExpectedUserFromRequestBody({
        providerId: reqBody.email.toLowerCase(),
        providerData: {},
        registrationOtp: true,
        registrationOtpCreatedAt: [ 'gt', now, 500 ],
        createdAt: [ 'gt', now, 500 ],
        updatedAt: 'createdAt'
      }));

      expectRegistrationEmailSent(registeredUser);
    });

    /**
     * Asserts that a registration email was sent for the specified user.
     *
     * This function will check the exact text of the email, and check that the
     * link contained within includes the correct email address and registration
     * OTP.
     *
     * @param {User} user - The user the registration email should have been sent for.
     */
    function expectRegistrationEmailSent(user) {

      const fakeLink = 'http://example.com';
      const fakeText = registrationEmailTemplate({ link: fakeLink });
      const fakeTextLinkIndex = fakeText.indexOf(fakeLink);
      const textRegexp = new RegExp(`^${escapeRegExp(fakeText.slice(0, fakeTextLinkIndex))}(https?://[^\\s]+?)${escapeRegExp(fakeText.slice(fakeTextLinkIndex + fakeLink.length))}$`);

      const registrationEmail = expectEmailSent({
        to: reqBody.email,
        subject: registrationEmailSubject,
        // TODO: link will contain a variable token in the future
        text: textRegexp
      });

      const textMatch = registrationEmail.text.match(textRegexp);
      const registrationLink = textMatch[1];

      const registrationUrl = new URL(registrationLink);
      expect(registrationUrl.origin, 'registrationLink.origin').to.equal(new URL(config.baseUrl).origin);
      expect(registrationUrl.pathname, 'registrationLink.pathname').to.equal('/register');
      expect(registrationUrl.username).to.equal('');
      expect(registrationUrl.password).to.equal('');

      const query = parseQueryString(registrationUrl.search);
      expect(query).to.have.all.keys([ 'email', 'otp' ]);
      expect(query.email).to.equal(user.get('email'));
      expect(query.otp).to.equal(user.get('registration_otp'));
    }

    /**
     * Returns an object representing the expected properties of a User, based
     * on the default request body for this test block.
     *
     * @param {...Object} changes - Additional expected changes compared to the
     *                              request body (merged with Lodash's `extend`).
     * @returns {Object} An expectation object.
     */
    function getExpectedUserFromRequestBody(...changes) {
      return extend({}, reqBody, ...changes);
    }
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
          .set('Authorization', `Bearer ${await user.generateJwt()}`);

        await expectUser(res.body, getExpectedUser(user));
      });

      it('should not retrieve another user', async function() {

        const anotherUser = await userFixtures.user();
        const res = this.test.res = await api
          .retrieve(`/users/${anotherUser.get('api_id')}`, { expectedStatus: 404 })
          .set('Authorization', `Bearer ${await user.generateJwt()}`);

        expectErrors(res, {
          code: 'record.notFound',
          message: `No user was found with ID ${anotherUser.get('api_id')}.`
        });
      });

      it('should not retrieve a non-existent user', async function() {

        const res = this.test.res = await api
          .retrieve('/users/foo', { expectedStatus: 404 })
          .set('Authorization', `Bearer ${await user.generateJwt()}`);

        expectErrors(res, {
          code: 'record.notFound',
          message: 'No user was found with ID foo.'
        });
      });
    });

    describe('as an admin', function() {

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
          .set('Authorization', `Bearer ${await admin.generateJwt()}`);

        await expectUser(res.body, getExpectedUser(admin, {
          providerData: {}
        }));
      });

      it('should retrieve another user', async function() {

        const res = this.test.res = await api
          .retrieve(`/users/${user.get('api_id')}`)
          .set('Authorization', `Bearer ${await admin.generateJwt()}`);

        await expectUser(res.body, getExpectedUser(user, {
          providerData: {}
        }));
      });

      it('should not retrieve a non-existent user', async function() {

        const res = this.test.res = await api
          .retrieve('/users/foo', { expectedStatus: 404 })
          .set('Authorization', `Bearer ${await admin.generateJwt()}`);

        expectErrors(res, {
          code: 'record.notFound',
          message: 'No user was found with ID foo.'
        });
      });
    });
  });

  describe('/api/me', function() {
    testMethodsNotAllowed('/me', require('../users/users.me.routes').allowedMethods['/']);
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
          .set('Authorization', `Bearer ${await user.generateJwt()}`);

        await expectUser(res.body, getExpectedUser(user));
      });
    });

    describe('as an admin', function() {
      beforeEach(async function() {
        await user.save({ roles: [ 'admin' ] });
      });

      it('should retrieve the user', async function() {

        const res = this.test.res = await api
          .retrieve('/me')
          .set('Authorization', `Bearer ${await user.generateJwt()}`);

        await expectUser(res.body, getExpectedUser(user, {
          providerData: {}
        }));
      });
    });
  });

  describe('createRegistrationLink', () => {
    it('should throw an error if called with a user that has no registration OTP', async function() {
      const user = await userFixtures.user();
      expect(() => createRegistrationLink(user)).to.throw(`User "${user.get('api_id')}" has no registration OTP`);
    });
  });

  describe('sendRegistrationEmail', () => {
    it('should throw an error if called with a user that has no email', async function() {
      const req = reqFixture();
      const user = await userFixtures.user({ email: null, providerId: 'foo' });
      expect(sendRegistrationEmail(req, user)).to.be.rejectedWith(`User "${user.get('api_id')}" has no email`);
      expectNoEmailsSent();
    });
  });
});
