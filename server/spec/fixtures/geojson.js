/**
 * Test utilities to generate GeoJSON data.
 *
 * @module server/spec/fixtures/geojson
 */
const chance = require('chance').Chance();

/**
 * Generates a GeoJSON point with random coordinates.
 *
 *     const geoJsonFixtures = require('../spec/fixtures/geojson');
 *
 *     geoJsonFixtures.point();  // { type: 'Point', coordinates: [ -76, 48 ] }
 *
 * @returns {object} A GeoJSON point.
 */
exports.point = function() {
  return {
    type: 'Point',
    coordinates: exports.coordinates()
  };
};

/**
 * Generates a random pair of coordinates (longitude & latitude).
 *
 *     const geoJsonFixtures = require('../spec/fixtures/geojson');
 *
 *     geoJsonFixtures.coordinates();  // [ -76, 48 ]
 *
 * @returns {number[]} A GeoJSON coordinates pair.
 */
exports.coordinates = function() {
  return [
    chance.floating({ min: -180, max: 180 }),
    chance.floating({ min: -90, max: 90 })
  ];
};
