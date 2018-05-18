const { assign } = require('lodash');

/**
 * Returns an object representing the expected properties of an Action, based on the specified Action.
 * (Can be used, for example, to check if a returned API response matches an action in the database.)
 *
 * @param {Theme} theme - A theme record.
 * @param {...Object} changes - Additional expected changes compared to the specified theme (merged with Lodash's `assign`).
 * @returns {Object} An expectations object.
 */
function getExpectedTheme(theme, ...changes) {
  return assign({
    id: theme.get('api_id'),
    title: theme.get('title'),
    description: theme.get('description'),
    photoUrl: theme.get('photo_url'),
    source: theme.get('source') ? theme.get('source') : undefined,
    createdAt: theme.get('created_at').toJSON(),
    updatedAt: theme.get('updated_at').toJSON()
  }, ...changes);
}

exports.getExpectedTheme = getExpectedTheme;
