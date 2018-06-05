/**
 * Test utilities to generate theme-related data.
 *
 * @module server/spec/fixtures/theme
 */
const chance = require('chance').Chance();
const _ = require('lodash');

const Theme = require('../../models/theme');
const { createRecord } = require('../utils');

/**
 * Generates a random theme record and saves it to the database.
 *
 * All of the generated theme's properties are assigned random values unless
 * changed with the `data` argument.
 *
 *     const themeFixtures = require('../spec/fixtures/theme');
 *
 *     const theme = await themeFixtures.theme({
 *       title: 'Custom title'
 *     });
 *
 *     console.log(theme.get('title'));        // "Custom title"
 *     console.log(theme.get('description'));  // "Lorem ipsum [...]"
 *
 * @function
 * @param {Object} [data={}] - Custom theme data.
 * @param {string} [data.title] - The title.
 * @param {string} [data.code] - Set to `null` to create a theme without a code.
 * @param {string} [data.description] - The description.
 * @param {string} [data.photoUrl] - A URL to a photo.
 * @param {string} [data.source] - Set to `null` to create a theme without a source.
 * @returns {Promise<Theme>} A promise that will be resolved with the saved theme.
 */
exports.theme = function(data = {}) {
  return createRecord(Theme, {
    title: data.title || chance.sentence({ words: 3 }),
    code: _.has(data, 'code') ? data.code : exports.code(),
    description: data.description || chance.paragraph(),
    photo_url: data.photoUrl || chance.url({ domain: 'example.com', extensions: [ 'jpg' ] }),
    source: _.has(data, 'source') ? data.source : chance.sentence({ words: 3 }),
    created_at: data.createdAt,
    updated_at: data.updatedAt
  });
};

/**
 * Generates a random theme code.
 * This code is composed of :
 * * A random letter
 * * A random integer between 0 and 9
 *
 *     const themeFixtures = require('../spec/fixtures/theme');
 *
 *     themeFixtures.code();  // "N7"
 *
 * @function
 * @returns {string} A code for a theme.
 */
exports.code = function() {
  return chance.letter().toUpperCase() + chance.integer({ min: 0, max: 9 });
};
