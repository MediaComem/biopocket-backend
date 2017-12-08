/**
 * @module server/api/validators/geojson
 */
const _ = require('lodash');

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
}

function validateCoordinates(ctx) {
  const coordinates = ctx.get('value');
  if (!_.isArray(coordinates) || coordinates.length != 2) {
    ctx.addError({
      validator: 'coordinates',
      message: 'must be an array of 2 numbers (longitude & latitude)'
    });
  }
}

function validateLongitude(ctx) {
  const longitude = ctx.get('value');
  if (typeof(longitude) != 'number' || longitude < -180 || longitude > 180) {
    ctx.addError({
      validator: 'longitude',
      message: 'must be a number between -180 and 180'
    });
  }
}

function validateLatitude(ctx) {
  const latitude = ctx.get('value');
  if (typeof(latitude) != 'number' || latitude < -90 || latitude > 90) {
    ctx.addError({
      validator: 'latitude',
      message: 'must be a number between -90 and 90'
    });
  }
}
