/**
 * @module server/api/validators/geojson
 */
const _ = require('lodash');

/**
 * Returns a ValDSL validator that checks whether a value is a well-formatted bounding box string.
 *
 * A bounding box string is composed of 4 comma-separated numbers:
 *
 * * The first 2 numbers are the coordinates (longitude & latitude) of the bounding box's south-west corner.
 * * The last 2 numbers are the coordinates (longitude & latitude) of the bounding box's north-east corner.
 *
 * @returns {function} A validator function.
 */
exports.bboxString = function() {
  return async function(ctx) {

    // Make sure the value is a string.
    const bbox = ctx.get('value');
    if (!_.isString(bbox)) {
      return ctx.addError({
        validator: 'bboxString',
        cause: 'wrongType',
        message: 'must be a string'
      });
    }

    // Make sure it has 4 values.
    const coordinates = bbox.split(',').map(value => parseFloat(value));
    if (coordinates.length !== 4) {
      return ctx.addError({
        validator: 'bboxString',
        cause: 'wrongLength',
        actualLength: coordinates.length,
        message: `must have 4 comma-separated coordinates; got ${coordinates.length}`
      });
    }

    // Make sure the 4 values are valid longitudes and latitudes.
    await Promise.all([
      validateBboxStringCoordinate(ctx, coordinates, 0, coordinateCtx => validateLongitude(coordinateCtx)),
      validateBboxStringCoordinate(ctx, coordinates, 1, coordinateCtx => validateLatitude(coordinateCtx)),
      validateBboxStringCoordinate(ctx, coordinates, 2, coordinateCtx => validateLongitude(coordinateCtx)),
      validateBboxStringCoordinate(ctx, coordinates, 3, coordinateCtx => validateLatitude(coordinateCtx))
    ]);
  };
};

/**
 * Returns a ValDSL validator that checks whether a value is a GeoJSON object of type Point.
 *
 *     const { point: validateGeoJsonPoint } = require('../validators/geojson');
 *
 *     this.validate(
 *       this.json('geometry'),
 *       validateGeoJsonPoint()
 *     )
 *
 * @returns {function} A validator function.
 */
exports.point = function() {
  return function(ctx) {
    return ctx.series(
      ctx.type('object'),
      ctx.properties('type', 'coordinates'),
      ctx.parallel(
        ctx.validate(
          ctx.json('/type'),
          ctx.required(),
          ctx.type('string'),
          ctx.equals('Point')
        ),
        ctx.validate(
          ctx.json('/coordinates'),
          ctx.required(),
          ctx.type('array'),
          validateCoordinates,
          ctx.parallel(
            ctx.validate(
              ctx.json('/0'),
              ctx.type('number'),
              validateLongitude
            ),
            ctx.validate(
              ctx.json('/1'),
              ctx.type('number'),
              validateLatitude
            )
          )
        )
      )
    );
  };
};

/**
 * Sets a ValDSL context's location to a JSON pointer corresponding to a coordinate within a bounding box string.
 *
 * @param {ValidationContext} ctx - The ValDSL validation context.
 * @param {number[]} coordinates - The parsed bounding box string.
 * @param {number} i - The index of the coordinate to validate.
 * @param {Function} callback - A function that will be called with the updated context.
 * @returns {Function} A validation function.
 */
function validateBboxStringCoordinate(ctx, coordinates, i, callback) {
  return ctx.validate(coordinateCtx => {

    // Make the error indicate the index of the invalid coordinate
    // within the bbox string, e.g. "bbox[1]".
    coordinateCtx.set({
      location: `${coordinateCtx.get('location')}[${i}]`,
      value: coordinates[i]
    });

    return callback(coordinateCtx);
  });
}

/**
 * Adds an error to the specified context if the current value is not a valid coordinates array (2 numbers).
 *
 * @param {ValidationContext} ctx - A ValDSL validation context.
 */
function validateCoordinates(ctx) {
  const coordinates = ctx.get('value');
  if (!_.isArray(coordinates) || coordinates.length !== 2) {
    ctx.addError({
      validator: 'coordinates',
      message: 'must be an array of 2 numbers (longitude & latitude)'
    });
  }
}

/**
 * Adds an error to the specified context if the current value is not a valid longitude.
 *
 * @param {ValidationContext} ctx - A ValDSL validation context.
 */
function validateLongitude(ctx) {
  const longitude = ctx.get('value');
  if (!_.isFinite(longitude) || longitude < -180 || longitude > 180) {
    ctx.addError({
      validator: 'longitude',
      message: 'must be a number between -180 and 180'
    });
  }
}

/**
 * Adds an error to the specified context if the current value is not a valid latitude.
 *
 * @param {ValidationContext} ctx - A ValDSL validation context.
 */
function validateLatitude(ctx) {
  const latitude = ctx.get('value');
  if (!_.isFinite(latitude) || latitude < -90 || latitude > 90) {
    ctx.addError({
      validator: 'latitude',
      message: 'must be a number between -90 and 90'
    });
  }
}
