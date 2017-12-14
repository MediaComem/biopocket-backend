/**
 * Test utilities to generate GeoJSON data.
 *
 * @module server/spec/fixtures/geojson
 */
const _ = require('lodash');
const chance = require('chance').Chance();

/**
 * Generates a GeoJSON point with random coordinates.
 *
 *     const geoJsonFixtures = require('../spec/fixtures/geojson');
 *
 *     geoJsonFixtures.point();  // { type: 'Point', coordinates: [ -76, 48 ] }
 *     geoJsonFixtures.point({ coordinates });  // { type: 'Point', coordinates: [ -76, 48 ] }
 *
 * @param {object} [data={}] - Custom point data.
 * @param {object} [data.bbox] - A bounding box within which the generated point should be.
 * @param {number[]} data.bbox.southWest - A longitude/latitude pair indicating the south-west corner of the bounding box.
 * @param {number[]} data.bbox.northEast - A longitude/latitude pair indicating the north-east corner of the bounding box.
 * @param {number[]} [data.coordinates] - The point's coordinates (longitude & latitude).
 * @returns {object} A GeoJSON point.
 */
exports.point = function(data = {}) {
  return {
    type: 'Point',
    coordinates: data.coordinates ? ensureCoordinates(data.coordinates) : exports.coordinates(_.pick(data, 'bbox'))
  };
};

/**
 * Generates a random pair of coordinates (longitude & latitude).
 *
 *     const geoJsonFixtures = require('../spec/fixtures/geojson');
 *
 *     geoJsonFixtures.coordinates();  // [ -76, 48 ]
 *
 * @param {object} [data={}] - Custom coordinates data.
 * @param {object} [data.bbox] - A bounding box within which the generated coordinates should be.
 * @param {number[]} data.bbox.southWest - A longitude/latitude pair indicating the south-west corner of the bounding box.
 * @param {number[]} data.bbox.northEast - A longitude/latitude pair indicating the north-east corner of the bounding box.
 * @returns {number[]} A GeoJSON coordinates pair.
 */
exports.coordinates = function(data = {}) {

  let minLatitude = -90;
  let maxLatitude = 90;
  let minLongitude = -180;
  let maxLongitude = 180;

  if (data.bbox) {
    const bbox = ensureBbox(data.bbox);
    minLatitude = bbox.southWest[1];
    maxLatitude = bbox.northEast[1];
    minLongitude = bbox.southWest[0];
    maxLongitude = bbox.northEast[0];
  }

  return [
    chance.floating({ min: minLongitude, max: maxLongitude }),
    chance.floating({ min: minLatitude, max: maxLatitude })
  ];
};

function ensureBbox(bbox) {
  if (!bbox) {
    throw new Error('Bounding box must be an object');
  } else if (!bbox.southWest) {
    throw new Error('Bounding box must have a "southWest" property');
  } else if (!bbox.northEast) {
    throw new Error('Bounding box must have a "northEast" property');
  }

  ensureCoordinates(bbox.southWest);
  ensureCoordinates(bbox.northEast);

  return bbox;
}

function ensureCoordinates(coordinates) {
  if (!coordinates) {
    throw new Error('Coordinates are required');
  } else if (!_.isArray(coordinates)) {
    throw new Error(`Coordinates must be an array, got ${typeof(coordinates)}`);
  } else if (coordinates.length != 2) {
    throw new Error(`Coordinates must be an array with 2 elements, but it has length ${coordinates.length}`);
  }

  const nan = coordinates.find(value => !_.isFinite(value))
  if (nan !== undefined) {
    throw new Error(`Coordinates must contain only numbers, got ${typeof(nan)}`);
  }

  const longitude = coordinates[0];
  if (longitude < -180 || longitude > 180) {
    throw new Error(`Longitude must be between -180 and 180, got ${longitude}`);
  }

  const latitude = coordinates[1];
  if (latitude < -90 || latitude > 90) {
    throw new Error(`Latitude must be between -90 and 90, got ${latitude}`);
  }

  return coordinates;
}
