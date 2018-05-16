/**
 * Test utilities to generate location-related data.
 *
 * @module server/spec/fixtures/location
 */
const chance = require('chance').Chance();
const _ = require('lodash');
const { unique: uniqueGenerator } = require('test-value-generator');

const Location = require('../../models/location');
const { createRecord } = require('../utils');
const geoJsonFixtures = require('./geojson');

/**
 * Generates a random location record and saves it to the database.
 *
 * All of the generated location's properties are assigned random values unless
 * changed with the `data` argument.
 *
 *     const locationFixtures = require('../spec/fixtures/location');
 *
 *     const location = await locationFixtures.location({
 *       name: 'Custom name'
 *     });
 *
 *     console.log(location.get('name'));        // "Custom name"
 *     console.log(location.get('short_name'));  // "Lorem ipsum"
 *
 * @function
 * @param {object} [data={}] - Custom location data.
 * @param {object} [data.bbox] - A bounding box within which the generated location should be.
 * @param {number[]} data.bbox.southWest - A longitude/latitude pair indicating the south-west corner of the bounding box.
 * @param {number[]} data.bbox.northEast - A longitude/latitude pair indicating the north-east corner of the bounding box.
 * @param {number[]} [data.bbox.padding] - 1 to 4 numbers indicating the padding of the bounding box
 *                                         (much like CSS padding, 1 number is all 4 directions, 2 numbers is northing/easting,
 *                                         3 numbers is north/easting/south, 4 numbers is north/east/south/west).
 * @param {string} [data.name]
 * @param {string} [data.shortName] - Set to `null` to create a location without a short name.
 * @param {string} [data.description]
 * @param {string} [data.phone]
 * @param {string} [data.photoUrl]
 * @param {string} [data.siteUrl]
 * @param {object} [data.geometry]
 * @param {object} [data.properties={}]
 * @param {object} [data.address]
 * @param {string} [data.address.street]
 * @param {string} [data.address.number] - Set to `null` to create an address without a number.
 * @param {string} [data.address.zipCode]
 * @param {string} [data.address.city]
 * @param {string} [data.address.state]
 * @returns {Promise<Location>} A promise that will be resolved with the saved location.
 */
exports.location = function(data = {}) {
  return createRecord(Location, {
    name: data.name || exports.name(),
    short_name: _.has(data, 'shortName') ? data.shortName : exports.shortName(),
    description: data.description || chance.paragraph(),
    phone: data.phone || chance.phone(),
    photo_url: data.photoUrl || chance.url({ domain: 'example.com', extensions: [ 'jpg' ] }),
    site_url: data.siteUrl || chance.url({ domain: 'example.com' }),
    geometry: data.geometry || geoJsonFixtures.point(_.pick(data, 'bbox')),
    properties: data.properties || {},
    address_street: _.get(data, 'address.street', chance.street()),
    address_number: _.get(data, 'address.number', chance.integer({ min: 1, max: 100 }).toString()),
    address_zip_code: _.get(data, 'address.zipCode', chance.zip()),
    address_city: _.get(data, 'address.city', chance.city()),
    address_state: _.get(data, 'address.state', chance.state()),
    created_at: data.createdAt,
    updated_at: data.updatedAt
  });
};

/**
 * Generates a unique random location name.
 *
 *     const locationFixtures = require('../spec/fixtures/location');
 *
 *     locationFixtures.name();  // "Lorem ipsum aute ad dolor exercitation labore amet"
 *
 * @function
 * @returns {string} A name for a location.
 */
exports.name = uniqueGenerator(function() {
  return chance.sentence();
});

/**
 * Generates a unique random location short name.
 *
 *     const locationFixtures = require('../spec/fixtures/location');
 *
 *     locationFixtures.shortName();  // "Lorem"
 *
 * @function
 * @returns {string} A short name for a location.
 */
exports.shortName = uniqueGenerator(function() {
  const word = chance.word();
  return word[0].toUpperCase() + word.slice(1);
})
