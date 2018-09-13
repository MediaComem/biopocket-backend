const chance = require('chance').Chance();
const _ = require('lodash');
const moment = require('moment');

const allowedMethodsFor = require('../locations/locations.routes').allowedMethods;
const expectLocation = require('../../spec/expectations/location');
const geoJsonFixtures = require('../../spec/fixtures/geojson');
const locationFixtures = require('../../spec/fixtures/location');
const userFixtures = require('../../spec/fixtures/user');
const { cleanDatabase, expect, expectDeleted, expectErrors, expectUnchanged, initSuperRest, setUp, testMethodsNotAllowed } = require('../../spec/utils');

setUp();

describe('Locations API', function() {

  let api, now, reqBody;

  beforeEach(async function() {
    api = initSuperRest();
    await cleanDatabase();
  });

  describe('/api/locations', function() {
    testMethodsNotAllowed('/locations', allowedMethodsFor['/']);
  });

  describe('POST /api/locations', function() {

    beforeEach(function() {

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
        now = new Date();
      });

      it('should create a location without optional properties', async function() {

        const res = this.test.res = await api
          .create('/locations', reqBody)
          .set('Authorization', `Bearer ${admin.generateJwt()}`);

        await expectLocation(res.body, getExpectedLocationFromRequestBody({
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

        await expectLocation(res.body, getExpectedLocationFromRequestBody({
          createdAt: [ 'gt', now, 500 ],
          updatedAt: 'createdAt'
        }));
      });

      it('should require mandatory properties', async function() {

        const res = this.test.res = await api
          .create('/locations', {}, { expectedStatus: 422 })
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
            message: 'is required',
            type: 'json',
            location: '/description',
            validator: 'required',
            valueSet: false
          },
          {
            message: 'is required',
            type: 'json',
            location: '/phone',
            validator: 'required',
            valueSet: false
          },
          {
            message: 'is required',
            type: 'json',
            location: '/photoUrl',
            validator: 'required',
            valueSet: false
          },
          {
            message: 'is required',
            type: 'json',
            location: '/siteUrl',
            validator: 'required',
            valueSet: false
          },
          {
            message: 'is required',
            type: 'json',
            location: '/geometry',
            validator: 'required',
            valueSet: false
          },
          {
            message: 'is required',
            type: 'json',
            location: '/address',
            validator: 'required',
            valueSet: false
          }
        ]);
      });

      it('should require mandatory address properties', async function() {

        reqBody.address = {};

        const res = this.test.res = await api
          .create('/locations', reqBody, { expectedStatus: 422 })
          .set('Authorization', `Bearer ${admin.generateJwt()}`);

        expectErrors(res, [
          {
            message: 'is required',
            type: 'json',
            location: '/address/street',
            validator: 'required',
            valueSet: false
          },
          {
            message: 'is required',
            type: 'json',
            location: '/address/zipCode',
            validator: 'required',
            valueSet: false
          },
          {
            message: 'is required',
            type: 'json',
            location: '/address/city',
            validator: 'required',
            valueSet: false
          },
          {
            message: 'is required',
            type: 'json',
            location: '/address/state',
            validator: 'required',
            valueSet: false
          }
        ]);
      });

      it('should not accept invalid properties', async function() {

        delete reqBody.name;
        reqBody.description = '';
        reqBody.shortName = '12345678901234567890123456789012';
        reqBody.phone = 5550001;
        reqBody.photoUrl = '   ';
        reqBody.siteUrl = false;
        reqBody.address.street = '';
        delete reqBody.address.city;
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
            location: '/address/city',
            validator: 'required',
            valueSet: false
          },
          {
            message: 'must not be blank',
            type: 'json',
            location: '/address/street',
            validator: 'notBlank',
            value: '',
            valueSet: true
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

    /**
     * Returns an object representing the expected properties of a Location, based on the default request body for this test block.
     *
     * @param {...Object} changes - Additional expected changes compared to the requets body (merged with Lodash's `merge`).
     * @returns {Object} An expectation object.
     */
    function getExpectedLocationFromRequestBody(...changes) {
      return _.merge({}, reqBody, ...changes);
    }
  });

  describe('GET /api/locations', function() {

    it('should list no locations', async function() {
      const res = this.test.res = await api.retrieve('/locations');
      expect(res.body).to.eql([]);
    });

    describe('with locations', function() {

      let locations;
      beforeEach(async function() {
        locations = await Promise.all([
          locationFixtures.location({ name: 'Location A - Somewhere' }),
          locationFixtures.location({ name: 'Location C - Somewhere else' }),
          locationFixtures.location({ name: 'Location B - Wheeeeeeee' })
        ]);
      });

      it('should list all locations ordered by name', async function() {
        const res = this.test.res = await api.retrieve('/locations');
        expect(res.body).to.be.an('array');
        await expectLocation(res.body[0], getExpectedLocation(locations[0]));
        await expectLocation(res.body[1], getExpectedLocation(locations[2]));
        await expectLocation(res.body[2], getExpectedLocation(locations[1]));
        expect(res.body).to.have.lengthOf(3);
      });

      describe('as a user', function() {

        let user;
        beforeEach(async function() {
          user = await userFixtures.user();
        });

        it('should not authenticate an invalid JWT', async function() {

          const res = this.test.res = await api
            .retrieve('/locations', { expectedStatus: 401 })
            .set('Authorization', `Bearer ${user.generateJwt({ exp: 1 })}`);

          expectErrors(res, {
            code: 'auth.invalidAuthorization',
            message: 'The Bearer token supplied in the Authorization header is invalid or has expired.'
          });
        });

        it('should list all locations ordered by name', async function() {

          const res = this.test.res = await api
            .retrieve('/locations')
            .set('Authorization', `Bearer ${user.generateJwt()}`);

          expect(res.body).to.be.an('array');
          await expectLocation(res.body[0], getExpectedLocation(locations[0]));
          await expectLocation(res.body[1], getExpectedLocation(locations[2]));
          await expectLocation(res.body[2], getExpectedLocation(locations[1]));
          expect(res.body).to.have.lengthOf(3);
        });
      });
    });

    describe('with locations in a specific area', function() {

      let locations;
      beforeEach(async function() {
        locations = await Promise.all([
          locationFixtures.location({ name: 'Location A - Somewhere', geometry: geoJsonFixtures.point({ bbox: { southWest: [ 9, 19 ], northEast: [ 11, 21 ] } }) }),
          locationFixtures.location({ name: 'Location C - Somewhere else', geometry: geoJsonFixtures.point({ bbox: { southWest: [ 19, 29 ], northEast: [ 21, 31 ] } }) }),
          locationFixtures.location({ name: 'Location B - Somewhere precise', geometry: geoJsonFixtures.point({ coordinates: [ 30, 40 ] }) })
        ]);
      });

      it('should list all locations in the area', async function() {

        const res = this.test.res = await api
          .retrieve('/locations')
          .query({
            bbox: '0,0,50,50'
          });

        expect(res.body).to.be.an('array');
        await expectLocation(res.body[0], getExpectedLocation(locations[0]));
        await expectLocation(res.body[1], getExpectedLocation(locations[2]));
        await expectLocation(res.body[2], getExpectedLocation(locations[1]));
        expect(res.body).to.have.lengthOf(3);
      });

      it('should list one location in a small area', async function() {

        const res = this.test.res = await api
          .retrieve('/locations')
          .query({
            bbox: '5,15,15,25'
          });

        expect(res.body).to.be.an('array');
        await expectLocation(res.body[0], getExpectedLocation(locations[0]));
        expect(res.body).to.have.lengthOf(1);
      });

      it('should list multiple locations in a large area', async function() {

        const res = this.test.res = await api
          .retrieve('/locations')
          .query({
            bbox: '15,25,35,45'
          });

        expect(res.body).to.be.an('array');
        await expectLocation(res.body[0], getExpectedLocation(locations[2]));
        await expectLocation(res.body[1], getExpectedLocation(locations[1]));
        expect(res.body).to.have.lengthOf(2);
      });

      it('should not list any location in the wrong area', async function() {

        const res = this.test.res = await api
          .retrieve('/locations')
          .query({
            bbox: '-20,-20,-10,-10'
          });

        expect(res.body).to.eql([]);
      });

      it('should not accept an invalid bounding box', async function() {

        const res = this.test.res = await api
          .retrieve('/locations', { expectedStatus: 400 })
          .query({
            bbox: '10,20,asd,30'
          });

        expectErrors(res, [
          {
            message: 'must be a number between -180 and 180',
            type: 'query',
            location: 'bbox[2]',
            validator: 'longitude',
            value: null,
            valueSet: true
          }
        ]);
      });
    });
  });

  describe('/api/locations/:id', function() {
    testMethodsNotAllowed('/locations/1', allowedMethodsFor['/:id']);
  });

  describe('GET /api/locations/:id', function() {

    let location;
    beforeEach(async function() {
      location = await locationFixtures.location();
    });

    it('should retrieve a location', async function() {
      const res = this.test.res = await api.retrieve(`/locations/${location.get('api_id')}`);
      await expectLocation(res.body, getExpectedLocation(location));
    });

    it('should not retrieve a location that does not exist', async function() {

      const res = this.test.res = await api.retrieve('/locations/foo', { expectedStatus: 404 });

      expectErrors(res, {
        code: 'record.notFound',
        message: 'No location was found with ID foo.'
      });
    });

    describe('as a user', function() {

      let user;
      beforeEach(async function() {
        user = await userFixtures.user();
      });

      it('should not authenticate an invalid JWT', async function() {

        const res = this.test.res = await api
          .retrieve(`/locations/${location.get('api_id')}`, { expectedStatus: 401 })
          .set('Authorization', `Bearer ${user.generateJwt({ exp: 1 })}`);

        expectErrors(res, {
          code: 'auth.invalidAuthorization',
          message: 'The Bearer token supplied in the Authorization header is invalid or has expired.'
        });
      });

      it('should retrieve a location', async function() {

        const res = this.test.res = await api
          .retrieve(`/locations/${location.get('api_id')}`)
          .set('Authorization', `Bearer ${user.generateJwt()}`);

        await expectLocation(res.body, getExpectedLocation(location));
      });
    });
  });

  describe('PATCH /api/locations/:id', function() {

    let location, twoDaysAgo;
    beforeEach(async function() {
      twoDaysAgo = moment().subtract(2, 'days').toDate();
      location = await locationFixtures.location({
        createdAt: twoDaysAgo,
        updatedAt: twoDaysAgo
      });
      reqBody = {};
    });

    it('should deny anonymous access', async function() {

      const res = this.test.res = await api.patch(`/locations/${location.get('api_id')}`, reqBody, { expectedStatus: 401 });

      expectErrors(res, {
        code: 'auth.missingAuthorization',
        message: 'Authentication is required to access this resource. Authenticate by providing a Bearer token in the Authorization header.'
      });
    });

    it('should deny access to a non-admin user', async function() {

      const user = await userFixtures.user();

      const res = this.test.res = await api
        .patch(`/locations/${location.get('api_id')}`, reqBody, { expectedStatus: 403 })
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
        now = new Date();
      });

      it('should update some properties of a location', async function() {

        _.extend(reqBody, {
          name: locationFixtures.name(),
          phone: chance.phone(),
          siteUrl: chance.url(),
          properties: {
            foo: 'bar'
          },
          address: {
            street: chance.street(),
            city: chance.city()
          }
        });

        const res = this.test.res = await api
          .patch(`/locations/${location.get('api_id')}`, reqBody)
          .set('Authorization', `Bearer ${admin.generateJwt()}`);

        await expectLocation(res.body, getExpectedLocation(location, reqBody, {
          updatedAt: [ 'gte', now, 500 ]
        }));
      });

      it('should update all properties of a location', async function() {

        _.extend(reqBody, {
          name: locationFixtures.name(),
          shortName: chance.word(),
          description: chance.paragraph(),
          phone: chance.phone(),
          photoUrl: chance.url({ extensions: [ 'png' ] }),
          siteUrl: chance.url(),
          geometry: geoJsonFixtures.point(),
          properties: {
            foo: 'bar'
          },
          address: {
            street: chance.street(),
            number: chance.integer({ min: 200, max: 300 }).toString(),
            city: chance.city(),
            state: chance.state(),
            zipCode: chance.zip()
          }
        });

        const res = this.test.res = await api
          .patch(`/locations/${location.get('api_id')}`, reqBody)
          .set('Authorization', `Bearer ${admin.generateJwt()}`);

        await expectLocation(res.body, getExpectedLocation(location, reqBody, {
          updatedAt: [ 'gte', now, 500 ]
        }));
      });

      it('should clear optional properties of a location', async function() {

        reqBody = {
          name: locationFixtures.name(),
          shortName: null,
          address: {
            number: null
          }
        };

        const res = this.test.res = await api
          .patch(`/locations/${location.get('api_id')}`, reqBody)
          .set('Authorization', `Bearer ${admin.generateJwt()}`);

        await expectLocation(res.body, getExpectedLocation(location, reqBody, {
          updatedAt: [ 'gte', now, 500 ]
        }));
      });

      it('should not do anything if no properties are updated', async function() {

        const res = this.test.res = await api
          .patch(`/locations/${location.get('api_id')}`, {})
          .set('Authorization', `Bearer ${admin.generateJwt()}`);

        await expectLocation(res.body, getExpectedLocation(location));
      });

      it('should not accept invalid properties', async function() {

        reqBody = {
          description: '',
          shortName: '12345678901234567890123456789012',
          phone: 5550001,
          photoUrl: '   ',
          siteUrl: false,
          address: {
            street: '',
            zipCode: '12345678901234567'
          },
          geometry: {
            type: 'MultiLineString',
            coordinates: [ 'foo', 666 ]
          },
          properties: [ 'foo' ]
        };

        const res = this.test.res = await api
          .patch(`/locations/${location.get('api_id')}`, reqBody, { expectedStatus: 422 })
          .set('Authorization', `Bearer ${admin.generateJwt()}`);

        expectErrors(res, [
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
            message: 'must not be blank',
            type: 'json',
            location: '/address/street',
            validator: 'notBlank',
            value: '',
            valueSet: true
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

      it('should not accept an incomplete geometry', async function() {

        reqBody = {
          geometry: {
            coordinates: [ 99, 66 ]
          }
        };

        const res = this.test.res = await api
          .patch(`/locations/${location.get('api_id')}`, reqBody, { expectedStatus: 422 })
          .set('Authorization', `Bearer ${admin.generateJwt()}`);

        expectErrors(res, {
          message: 'must have properties "type", "coordinates"',
          type: 'json',
          location: '/geometry',
          validator: 'properties',
          cause: 'missingProperties',
          expectedProperties: [ 'type', 'coordinates' ],
          missingProperties: [ 'type' ],
          value: { coordinates: [ 99, 66 ] },
          valueSet: true
        });
      });
    });
  });

  describe('DELETE /api/locations/:id', function() {

    let location;
    beforeEach(async function() {
      location = await locationFixtures.location();
    });

    it('should deny anonymous access', async function() {

      const res = this.test.res = await api.delete(`/locations/${location.get('api_id')}`, reqBody, { expectedStatus: 401 });

      expectErrors(res, {
        code: 'auth.missingAuthorization',
        message: 'Authentication is required to access this resource. Authenticate by providing a Bearer token in the Authorization header.'
      });

      await expectUnchanged(location);
    });

    it('should deny access to a non-admin user', async function() {

      const user = await userFixtures.user();

      const res = this.test.res = await api
        .delete(`/locations/${location.get('api_id')}`, reqBody, { expectedStatus: 403 })
        .set('Authorization', `Bearer ${user.generateJwt()}`);

      expectErrors(res, {
        code: 'auth.forbidden',
        message: 'You are not authorized to access this resource. Authenticate with a user account that has more privileges.'
      });

      await expectUnchanged(location);
    });

    describe('as an admin', function() {

      let admin;
      beforeEach(async function() {
        admin = await userFixtures.admin();
      });

      it('should delete a location', async function() {

        this.test.res = await api
          .delete(`/locations/${location.get('api_id')}`, reqBody, { expectedStatus: 204 })
          .set('Authorization', `Bearer ${admin.generateJwt()}`);

        await expectDeleted(location);
      });

      it('should not delete a location that does not exist', async function() {

        const res = this.test.res = await api
          .delete('/locations/foo', reqBody, { expectedStatus: 404 })
          .set('Authorization', `Bearer ${admin.generateJwt()}`);

        expectErrors(res, {
          code: 'record.notFound',
          message: 'No location was found with ID foo.'
        });

        await expectUnchanged(location);
      });
    });
  });

  /**
   * Returns an object representing the expected properties of a Location, based on the specified Location.
   * (Can be used, for example, to check if a returned API response matches a Location in the database.)
   *
   * @param {Location} location - The location to build the expectations from.
   * @param {...Object} changes - Additional expected changes compared to the specified Location (merged with Lodash's `extend`).
   * @returns {Object} An expectations object.
   */
  function getExpectedLocation(location, ...changes) {
    return _.merge({
      id: location.get('api_id'),
      name: location.get('name'),
      shortName: location.get('short_name'),
      description: location.get('description'),
      phone: location.get('phone'),
      photoUrl: location.get('photo_url'),
      siteUrl: location.get('site_url'),
      geometry: location.get('geometry'),
      properties: location.get('properties'),
      address: {
        street: location.get('address_street'),
        number: location.get('address_number'),
        city: location.get('address_city'),
        state: location.get('address_state'),
        zipCode: location.get('address_zip_code')
      },
      createdAt: location.get('created_at'),
      updatedAt: location.get('updated_at')
    }, ...changes);
  }
});
