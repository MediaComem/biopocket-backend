const _ = require('lodash');
const moment = require('moment');

const Location = require('../../models/location');
const expectLocation = require('../../spec/expectations/location');
const userFixtures = require('../../spec/fixtures/user');
const { cleanDatabase, expect, expectErrors, initSuperRest, setUp } = require('../../spec/utils');

setUp();

describe('Locations API', function() {

  let api, reqBody, twoDaysAgo;
  beforeEach(async function() {
    api = initSuperRest();
    await cleanDatabase();
    twoDaysAgo = moment().subtract(2, 'days').toDate();
  });

  describe('POST /api/locations', function() {

    let now, reqBody;
    beforeEach(async function() {

      reqBody = {
        name: 'Somewhere over the rainbow',
        description: 'Somewhere over the rainbow blue birds fly and the dreams that you dreamed of really do come true.',
        phone: '5550001',
        photoUrl: 'http://example.com/image.jpg',
        siteUrl: 'http://example.com',
        geometry: {
          type: 'Point',
          coordinates: [ -73.957820, 40.772317 ]
        },
        address: {
          street: 'Riverside Drive',
          city: 'New York',
          state: 'New York',
          zipCode: '10021'
        }
      };

      now = new Date();
    });

    it('should deny anonymous access', async function() {

      const res = this.test.res = await api.create('/locations', reqBody, { expectedStatus: 401 });

      expectErrors(res, {
        code: 'auth.missingAuthorization',
        message: 'Authentication is required to access this resource. Authenticate by providing a Bearer token in the Authorization header.'
      });
    });

    it('should deny access to a non-admin user', async function() {

      const user = await userFixtures.user();
      const res = this.test.res = await api
        .create('/locations', reqBody, { expectedStatus: 403 })
        .set('Authorization', `Bearer ${user.generateJwt()}`);

      expectErrors(res, {
        code: 'auth.forbidden',
        message: 'You are not authorized to access this resource. Authenticate with a user account that has more privileges.'
      });
    });

    describe('as an admin', function() {

      let admin;
      beforeEach(async function() {
        admin = await userFixtures.admin();
      });

      it('should create a location without optional properties', async function() {

        const res = this.test.res = await api
          .create('/locations', reqBody)
          .set('Authorization', `Bearer ${admin.generateJwt()}`);

        await expectLocation(res.body, getExpectedLocation({
          properties: {},
          createdAt: [ 'gt', now, 500 ],
          updatedAt: 'createdAt'
        }));
      });

      it('should create a location with all properties', async function() {

        reqBody.shortName = 'Somewhere';
        reqBody.address.number = '210';
        reqBody.properties = {
          foo: 'bar',
          bar: [ 'baz', 'qux' ]
        };

        const res = this.test.res = await api
          .create('/locations', reqBody)
          .set('Authorization', `Bearer ${admin.generateJwt()}`);

        await expectLocation(res.body, getExpectedLocation({
          createdAt: [ 'gt', now, 500 ],
          updatedAt: 'createdAt'
        }));
      });

      it('should not accept invalid properties', async function() {

        delete reqBody.name;
        reqBody.description = '';
        reqBody.shortName = '12345678901234567890123456789012';
        reqBody.phone = 5550001;
        reqBody.photoUrl = '   ';
        reqBody.siteUrl = false;
        reqBody.address.street = '';
        delete reqBody.address.street;
        reqBody.address.zipCode = '12345678901234567';
        reqBody.geometry = {
          type: 'MultiLineString',
          coordinates: [ 'foo', 666 ]
        };
        reqBody.properties = [ 'foo' ];

        const res = this.test.res = await api
          .create('/locations', reqBody, { expectedStatus: 422 })
          .set('Authorization', `Bearer ${admin.generateJwt()}`);

        expectErrors(res, [
          {
            message: 'is required',
            type: 'json',
            location: '/name',
            validator: 'required',
            valueSet: false
          },
          {
            message: 'must be of type string',
            type: 'json',
            location: '/phone',
            validator: 'type',
            types: [ 'string' ],
            value: 5550001,
            valueSet: true
          },
          {
            message: 'must be of type string',
            type: 'json',
            location: '/siteUrl',
            validator: 'type',
            types: [ 'string' ],
            value: false,
            valueSet: true
          },
          {
            message: 'must be of type object',
            type: 'json',
            location: '/properties',
            validator: 'type',
            types: [ 'object' ],
            value: [ 'foo' ],
            valueSet: true
          },
          {
            message: 'must be a string between 1 and 30 characters long (the supplied string is too long: 32 characters long)',
            type: 'json',
            location: '/shortName',
            validator: 'string',
            validation: 'between',
            minLength: 1,
            maxLength: 30,
            actualLength: 32,
            cause: 'tooLong',
            value: '12345678901234567890123456789012',
            valueSet: true
          },
          {
            message: 'must not be blank',
            type: 'json',
            location: '/description',
            validator: 'notBlank',
            value: '',
            valueSet: true
          },
          {
            message: 'must not be blank',
            type: 'json',
            location: '/photoUrl',
            validator: 'notBlank',
            value: '   ',
            valueSet: true
          },
          {
            message: 'is required',
            type: 'json',
            location: '/address/street',
            validator: 'required',
            valueSet: false
          },
          {
            message: 'must be equal to "Point"',
            type: 'json',
            location: '/geometry/type',
            validator: 'equal',
            value: 'MultiLineString',
            valueSet: true
          },
          {
            message: 'must be a string between 1 and 15 characters long (the supplied string is too long: 17 characters long)',
            type: 'json',
            location: '/address/zipCode',
            validator: 'string',
            validation: 'between',
            minLength: 1,
            maxLength: 15,
            actualLength: 17,
            cause: 'tooLong',
            value: '12345678901234567',
            valueSet: true
          },
          {
            message: 'must be of type number',
            type: 'json',
            location: '/geometry/coordinates/0',
            types: [ 'number' ],
            validator: 'type',
            value: 'foo',
            valueSet: true
          },
          {
            message: 'must be a number between -90 and 90',
            type: 'json',
            location: '/geometry/coordinates/1',
            validator: 'latitude',
            value: 666,
            valueSet: true
          }
        ]);
      });
    });

    function getExpectedLocation(...changes) {
      return _.merge({}, reqBody, ...changes);
    }
  });
});
