const _ = require('lodash');

const { expect } = require('../../spec/utils');
const { dsl } = require('../utils/validation');
const geoJsonValidators = require('./geojson');

describe('GeoJSON validators', function() {

  describe('bboxString', function() {

    const validateBboxString = geoJsonValidators.bboxString;

    it('should be a function', function() {
      expect(validateBboxString).to.be.a('function');
    });

    it('should create a validator function', function() {
      expect(validateBboxString()).to.be.a('function');
    });

    it('should add no error for a valid bounding box', async function() {
      const err = await validate('10,20,30,40');
      expect(err).to.equal(undefined);
    });

    it('should add an error if the bounding box is not a string', async function() {
      const err = await validate(10203040);
      expectErrors(err, [
        {
          cause: 'wrongType',
          location: 'bbox',
          message: 'must be a string',
          validator: 'bboxString',
          value: 10203040,
          valueSet: true
        }
      ]);
    });

    it('should add an error if the bounding box has the wrong number of coordinates', async function() {
      const err = await validate('10,20,30');
      expectErrors(err, [
        {
          cause: 'wrongLength',
          actualLength: 3,
          location: 'bbox',
          message: 'must have 4 comma-separated coordinates; got 3',
          validator: 'bboxString',
          value: '10,20,30',
          valueSet: true
        }
      ]);
    });

    it('should add an error if one of the coordinates is not a number', async function() {
      const err = await validate('10,asd,30,40');
      expectErrors(err, [
        {
          location: 'bbox[1]',
          message: 'must be a number between -90 and 90',
          validator: 'latitude',
          value: NaN,
          valueSet: true
        }
      ]);
    });

    // Generate 8 tests to check the longitude/latitude bounds.
    [
      { index: 0, value: -190, problem: 'the longitude of the south-west corner is too small', message: 'must be a number between -180 and 180', validator: 'longitude' },
      { index: 0, value: 213.4, problem: 'the longitude of the south-west corner is too large', message: 'must be a number between -180 and 180', validator: 'longitude' },
      { index: 1, value: -91, problem: 'the latitude of the south-west corner is too small', message: 'must be a number between -90 and 90', validator: 'latitude' },
      { index: 1, value: 90.001, problem: 'the latitude of the south-west corner is too large', message: 'must be a number between -90 and 90', validator: 'latitude' },
      { index: 2, value: -180.5, problem: 'the longitude of the north-east corner is too small', message: 'must be a number between -180 and 180', validator: 'longitude' },
      { index: 2, value: 181, problem: 'the longitude of the north-east corner is too large', message: 'must be a number between -180 and 180', validator: 'longitude' },
      { index: 3, value: -180, problem: 'the latitude of the north-east corner is too small', message: 'must be a number between -90 and 90', validator: 'latitude' },
      { index: 3, value: 1000, problem: 'the latitude of the north-east corner is too large', message: 'must be a number between -90 and 90', validator: 'latitude' }
    ].forEach(config => {
      it(`should add an error if ${config.problem}`, async function() {

        const coordinates = [ 10, 20, 30, 40 ];
        coordinates[config.index] = config.value;

        const err = await validate(coordinates.join(','));
        expect(err).not.to.equal(undefined);
        expectErrors(err, [
          {
            location: `bbox[${config.index}]`,
            message: config.message,
            validator: config.validator,
            value: config.value,
            valueSet: true
          }
        ]);
      });
    });

    /**
     * Validates the specified value as a bounding box query parameter.
     *
     * @async
     * @param {string} value - A bounding box string.
     * @returns {Promise<Error>} A promise that will be resolved with the validation error.
     */
    async function validate(value) {

      let validationError;
      await dsl(function(ctx) {
        ctx.set({
          location: 'bbox'
        });

        return ctx.validate(ctx.value(value), ctx.while(ctx.noError(ctx.atCurrentLocation())), validateBboxString());
      }).catch(err => {
        validationError = err;
      });

      return validationError;
    }
  });

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

    /**
     * Validates the specified argument using the GeoJSON point validator and returns the validation error.
     *
     * @private
     * @param {*} point - The point to validate.
     * @returns {Error} The validation error.
     */
    async function validate(point) {

      let validationError;
      await dsl(function(ctx) {
        return ctx.validate(ctx.value(point), ctx.while(ctx.noError(ctx.atCurrentLocation())), validatePoint());
      }).catch(err => {
        validationError = err;
      });

      return validationError;
    }
  });
});

/**
 * Expects the specified validation error to contains specified errors.
 *
 * @private
 * @param {Error} validationError - The validation error.
 * @param {Object[]} expectedErrors - An array of the expected errors.
 */
function expectErrors(validationError, expectedErrors) {
  expect(validationError).not.to.equal(undefined);
  const actualErrors = validationError.errors.map(err => _.omit(err, 'stack'));
  expect(actualErrors).to.have.objects(expectedErrors);
}
