const _ = require('lodash');

const { expect } = require('../../spec/utils');
const { dsl } = require('../utils/validation');
const geoJsonValidators = require('./geojson');

describe('GeoJSON validators', function() {

  describe('point', function() {

    const validatePoint = geoJsonValidators.point;

    it('should be a function', function() {
      expect(validatePoint).to.be.a('function');
    });

    it('should create a validator function', function() {
      expect(validatePoint()).to.be.a('function');
    });

    it('should add no error for a valid point', async function() {

      const err = await validate({
        type: 'Point',
        coordinates: [ 24, 42 ]
      });

      expect(err).to.equal(undefined);
    });

    it('should add an error if the point is missing properties', async function() {

      const point = {
        type: 'Point'
      };

      const err = await validate(point);

      expect(err).not.to.equal(undefined);
      expectErrors(err, [
        {
          cause: 'missingProperties',
          expectedProperties: [ 'type', 'coordinates' ],
          missingProperties: [ 'coordinates' ],
          message: 'must have properties "type", "coordinates"',
          validator: 'properties',
          value: point,
          valueSet: true
        },
        {
          message: 'is required',
          type: 'json',
          location: '/coordinates',
          validator: 'required',
          value: undefined,
          valueSet: false
        }
      ]);
    });

    it('should add an error if the point has extra properties', async function() {

      const point = {
        type: 'Point',
        coordinates: [ 24, 42 ],
        foo: 'bar',
        baz: 'qux'
      };

      const err = await validate(point);

      expect(err).not.to.equal(undefined);
      expectErrors(err, [
        {
          cause: 'extraProperties',
          expectedProperties: [ 'type', 'coordinates' ],
          extraProperties: [ 'foo', 'baz' ],
          message: 'must not have other properties than "type", "coordinates"',
          validator: 'properties',
          value: point,
          valueSet: true
        }
      ]);
    });

    it('should add an error if the coordinates are not an array', async function() {

      const point = {
        type: 'Point',
        coordinates: 'foo'
      };

      const err = await validate(point);

      expect(err).not.to.equal(undefined);
      expectErrors(err, [
        {
          message: 'must be of type array',
          type: 'json',
          location: '/coordinates',
          types: [ 'array' ],
          validator: 'type',
          value: 'foo',
          valueSet: true
        }
      ]);
    });

    it('should add an error if there are fewer than 2 coordinates', async function() {

      const point = {
        type: 'Point',
        coordinates: [ 24 ]
      };

      const err = await validate(point);

      expect(err).not.to.equal(undefined);
      expectErrors(err, [
        {
          message: 'must be an array of 2 numbers (longitude & latitude)',
          type: 'json',
          location: '/coordinates',
          validator: 'coordinates',
          value: [ 24 ],
          valueSet: true
        }
      ]);
    });

    it('should add an error if there are more than 2 coordinates', async function() {

      const point = {
        type: 'Point',
        coordinates: [ 24, 42, 66 ]
      };

      const err = await validate(point);

      expect(err).not.to.equal(undefined);
      expectErrors(err, [
        {
          message: 'must be an array of 2 numbers (longitude & latitude)',
          type: 'json',
          location: '/coordinates',
          validator: 'coordinates',
          value: [ 24, 42, 66 ],
          valueSet: true
        }
      ]);
    });

    it('should add an error if the longitude is not a number', async function() {

      const point = {
        type: 'Point',
        coordinates: [ 'foo', 42 ]
      };

      const err = await validate(point);

      expect(err).not.to.equal(undefined);
      expectErrors(err, [
        {
          message: 'must be of type number',
          type: 'json',
          location: '/coordinates/0',
          types: [ 'number' ],
          validator: 'type',
          value: 'foo',
          valueSet: true
        }
      ]);
    });

    it('should add an error if the longitude is out of bounds', async function() {

      const point = {
        type: 'Point',
        coordinates: [ -248, 42 ]
      };

      const err = await validate(point);

      expect(err).not.to.equal(undefined);
      expectErrors(err, [
        {
          message: 'must be a number between -180 and 180',
          type: 'json',
          location: '/coordinates/0',
          validator: 'longitude',
          value: -248,
          valueSet: true
        }
      ]);
    });

    it('should add an error if the latitude is not a number', async function() {

      const point = {
        type: 'Point',
        coordinates: [ 24, 'bar' ]
      };

      const err = await validate(point);

      expect(err).not.to.equal(undefined);
      expectErrors(err, [
        {
          message: 'must be of type number',
          type: 'json',
          location: '/coordinates/1',
          types: [ 'number' ],
          validator: 'type',
          value: 'bar',
          valueSet: true
        }
      ]);
    });

    it('should add an error if the latitude is out of bounds', async function() {

      const point = {
        type: 'Point',
        coordinates: [ 42, 100 ]
      };

      const err = await validate(point);

      expect(err).not.to.equal(undefined);
      expectErrors(err, [
        {
          message: 'must be a number between -90 and 90',
          type: 'json',
          location: '/coordinates/1',
          validator: 'latitude',
          value: 100,
          valueSet: true
        }
      ]);
    });

    async function validate(point) {

      let validationError;
      await dsl(function(ctx) {
        return ctx.validate(ctx.value(point), ctx.while(ctx.noError(ctx.atCurrentLocation())), validatePoint());
      }).catch(err => validationError = err);

      return validationError;
    }
  });
});

function expectErrors(validationError, expectedErrors) {
  const actualErrors = validationError.errors.map(err => _.omit(err, 'stack'));
  expect(actualErrors).to.have.objects(expectedErrors);
}
