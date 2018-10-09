/**
 * Test utilities to generate action-related data.
 *
 * @module server/spec/fixtures/action
 */
const chance = require('chance').Chance();
const _ = require('lodash');

const Action = require('../../models/action');
const Theme = require('../../models/theme');
const themeFixture = require('../fixtures/theme');
const { createRecord } = require('../utils');

/**
 * Generates a random action record and saves it to the database.function
 *
 * All of the generated action's properties are assigned random values unless changed with the `data` argument.
 *
 *     const actionFixtures = require('../spec/fixtures/action');
 *
 *     const action = await actionFixtures.action({
 *       title: 'Custom title'
 *     });
 *
 *     console.log(action.get('title'));        // "Custom title"
 *     console.log(action.get('description'));  // "Lorem ipsum [...]"
 *
 * Since an action is related to a [theme]{@link Theme}, the [`theme()`]{@link module:server/spec/fixtures/theme} fixture function will be used to generate a new theme for this new action.
 *
 * If you want to use a pre-existing theme, you can set it to the `data.theme` property ; the new action will be generated as related to this given theme.
 *
 *     const actionFixtures = require('../spec/fixtures/action');
 *     const theme = require('../spec/fixtures/theme').theme();
 *
 *     const action = await actionFixtures.action({
 *       theme: theme
 *     });
 *
 *     console.log(theme.get('id'));        // 15
 *     console.log(action.get('theme_id')); // 15
 *
 * @function
 * @param {Object} [data={theme}] - Custom theme data.
 * @param {string} [data.title] - The action's title.
 * @param {string} [data.code] - Set to `null` to create an action without code.
 * @param {string} [data.description] - The action's description.
 * @param {Theme} [data.theme] - A new Theme will be generated and used if none provided.
 * @param {Date|Moment|string} [data.createdAt] - Creation date.
 * @param {Date|Moment|string} [data.updatedAt] - Last update date.
 * @returns {Promise<Action>} A promise that will be resolved with the saved action.
 */
exports.action = async function(data = {}) {
  if (!data.theme) {
    data.theme = await themeFixture.theme();
  } else if (!(data.theme instanceof Theme)) {
    throw new TypeError('The given data.theme value is not an instance of Theme.');
  }

  const action = await createRecord(Action, {
    title: data.title || chance.sentence({ words: 3 }),
    code: _.has(data, 'code') ? data.code : exports.code(),
    description: data.description || chance.sentence(),
    impact: data.impact || chance.sentence(),
    theme_id: data.theme.id,
    created_at: data.createdAt,
    updated_at: data.updatedAt
  });

  action.relations.theme = data.theme;

  return action;
};

/**
 * Generates a random action code.
 *
 * This code is composed of :
 * * A random letter
 * * A random integer between 0 and 9
 * * A dash
 * * A second random integer between 0 and 9
 *
 *        const actionFixtures = require('../spec/fixtures/action');
 *
 *        actionFixtures.code();  // "N7-5"
 *
 * @function
 * @returns {string} A code for an action.
 */
exports.code = function() {
  return `${themeFixture.code()}-${chance.integer({ min: 0, max: 9 })}`;
};
