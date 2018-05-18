/**
 * Test utilities to generate GeoJSON data.
 *
 * @module server/spec/fixtures/geojson
 */
const chance = require('chance').Chance();
const _ = require('lodash');

/**
 * Generates a GeoJSON point with random coordinates.
 *
 *     const geoJsonFixtures = require('../spec/fixtures/geojson');
 *
 *     geoJsonFixtures.point();  // { type: 'Point', coordinates: [ -76, 48 ] }
 *     geoJsonFixtures.point({ coordinates });  // { type: 'Point', coordinates: [ -76, 48 ] }
 *
 * @param {Object} [data={}] - Custom point data.
 * @param {Object} [data.bbox] - A bounding box within which the generated point should be.
 * @param {number[]} data.bbox.southWest - A longitude/latitude pair indicating the south-west corner of the bounding box.
 * @param {number[]} data.bbox.northEast - A longitude/latitude pair indicating the north-east corner of the bounding box.
 * @param {number[]} [data.bbox.padding] - 1 to 4 numbers indicating the padding of the bounding box
 *                                         (much like CSS padding, 1 number is all 4 directions, 2 numbers is northing/easting,
 *                                         3 numbers is north/easting/south, 4 numbers is north/east/south/west).
 * @param {number[]} [data.coordinates] - The point's coordinates (longitude & latitude).
 * @returns {Object} A GeoJSON point.
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
 * @param {Object} [data={}] - Custom coordinates data.
 * @param {Object} [data.bbox] - A bounding box within which the generated coordinates should be.
 * @param {number[]} data.bbox.southWest - A longitude/latitude pair indicating the south-west corner of the bounding box.
 * @param {number[]} data.bbox.northEast - A longitude/latitude pair indicating the north-east corner of the bounding box.
 * @param {number[]} [data.bbox.padding] - 1 to 4 numbers indicating the padding of the bounding box
 *                                         (much like CSS padding, 1 number is all 4 directions, 2 numbers is northing/easting,
 *                                         3 numbers is north/easting/south, 4 numbers is north/east/south/west).
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

    if (bbox.padding !== undefined) {

      const padding = normalizePadding(bbox.padding);
      minLatitude += padding[2];
      maxLatitude -= padding[0];
      minLongitude += padding[3];
      maxLongitude -= padding[1];
    }
  }

  return [
    chance.floating({ min: minLongitude, max: maxLongitude }),
    chance.floating({ min: minLatitude, max: maxLatitude })
  ];
};

/**
 * Ensures that the specified argument is a valid bounding box object.
 *
 * @param {Object} bbox - The bounding box object to check.
 * @param {number[]} bbox.southWest - The south-west corner of the bounding box.
 * @param {number[]} bbox.northEast - The north-east corner of the bounding box.
 * @returns {Object} The bounding box object.
 */
function ensureBbox(bbox) {
  if (!_.isObject(bbox)) {
    throw new Error('Bounding box must be an object');
  } else if (!bbox.southWest) {
    throw new Error('Bounding box must have a "southWest" property');
  } else if (!bbox.northEast) {
    throw new Error('Bounding box must have a "northEast" property');
  }

  ensureCoordinates(bbox.southWest);
  ensureCoordinates(bbox.northEast);

  if (bbox.southWest[1] > bbox.northEast[1]) {
    throw new Error(`Bounding box south west ${JSON.stringify(bbox.southWest)} has a greater latitude than north east ${JSON.stringify(bbox.northEast)}`);
  } else if (bbox.southWest[0] > bbox.northEast[0]) {
    throw new Error(`Bounding box south west ${JSON.stringify(bbox.southWest)} has a greater longitude than north east ${JSON.stringify(bbox.northEast)}`);
  }

  if (bbox.padding !== undefined) {
    ensurePadding(bbox.padding);

    const padding = normalizePadding(bbox.padding);

    const minLongitude = bbox.southWest[0] + padding[3];
    const maxLongitude = bbox.northEast[0] - padding[1];
    if (minLongitude > maxLongitude) {
      throw new Error(`Padding ${JSON.stringify(bbox.padding)} for bounding box ${JSON.stringify(bbox.southWest.concat(bbox.northEast))} would cause minimum longitude ${minLongitude} to be greater than the maximum ${maxLongitude}`);
    }

    const minLatitude = bbox.southWest[1] + padding[2];
    const maxLatitude = bbox.northEast[1] - padding[0];
    if (minLatitude > maxLatitude) {
      throw new Error(`Padding ${JSON.stringify(bbox.padding)} for bounding box ${JSON.stringify(bbox.southWest.concat(bbox.northEast))} would cause minimum latitude ${minLatitude} to be greater than the maximum ${maxLatitude}`);
    }
  }

  return bbox;
}

/**
 * Ensures that the specified argument is a valid coordinates array (with a longitude and latitude).
 *
 * @param {number[]} coordinates - The coordinates array to check.
 * @returns {number[]} The coordinates array.
 */
function ensureCoordinates(coordinates) {
  if (!_.isArray(coordinates)) {
    throw new Error(`Coordinates must be an array, got ${typeof coordinates}`);
  } else if (coordinates.length !== 2) {
    throw new Error(`Coordinates must be an array with 2 elements, but it has length ${coordinates.length}`);
  }

  const nan = coordinates.find(value => !_.isFinite(value));
  if (nan !== undefined) {
    throw new Error(`Coordinates must contain only numbers, got ${typeof nan}`);
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

/**
 * Ensures that the specified argument is a valid padding definition (a number or an array of 1 to 4 numbers).
 *
 * @param {number|number[]} padding - The padding to check.
 * @returns {number|number[]} The padding.
 */
function ensurePadding(padding) {
  if (!_.isArray(padding) && typeof padding !== 'number') {
    throw new Error(`Padding must be an array or a number, got ${typeof padding}`);
  } else if (_.isArray(padding) && (padding.length < 1 || padding.length > 4)) {
    throw new Error(`Padding array must have 1 to 4 elements, got ${padding.length}`);
  } else if (_.isArray(padding) && padding.some(value => typeof value !== 'number')) {
    throw new Error(`Padding array must contain only numbers, got [${padding.map(value => typeof value).join(',')}]`);
  } else if (_.isArray(padding) && padding.some(value => value < 0)) {
    throw new Error(`Padding array must contain only zeros or positive numbers, got ${JSON.stringify(padding)}`);
  } else if (typeof padding === 'number' && padding < 0) {
    throw new Error(`Padding must be zero or a positive number, got ${padding}`);
  } else {
    return padding;
  }
}

/**
 * Normalizes a padding definition to an array of 4 numbers.
 *
 * @param {number|number[]} padding - The padding.
 * @returns {number[]} An array of 4 numbers (north, east, south and west).
 */
function normalizePadding(padding) {
  if (typeof padding === 'number') {
    return new Array(4).fill(padding);
  } else if (padding.length === 1) {
    return new Array(4).fill(padding[0]);
  } else if (padding.length === 2) {
    return [ padding[0], padding[1], padding[0], padding[1] ];
  } else if (padding.length === 3) {
    return [ ...padding, padding[1] ];
  } else {
    return padding;
  }
}
