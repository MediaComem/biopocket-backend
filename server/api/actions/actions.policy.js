const { includes } = require('lodash');

const { serialize: serializeTheme } = require('../themes/themes.policy');

/**
 * Anyone can list actions.
 *
 * @function
 * @name canList
 * @memberof module:server/api/actions
 * @returns {boolean} `true` if user can list, `false` otherwise
 */
exports.canList = function() {
  return true;
};

/**
 * Anyone can retrieve an action.
 *
 * @function
 * @name canRetrieve
 * @memberof module:server/api/actions
 *
 * @returns {boolean} `true` if user can retrive, `false` otherwise
 */
exports.canRetrieve = function() {
  return true;
};

/**
 * Serializes an action for API responses.
 *
 * @function
 * @name serialize
 * @memberof module:server/api/actions
 *
 * @param {Request} req - The Express request object.
 * @param {Action} action - An action record.
 * @param {Object} [options] - An object containing custom options.
 * @param {array} [options.include] - An array of relations to include. Wil override any include query parameter
 * @returns {Object} A serialized action.
 */
exports.serialize = function(req, action, options = {}) {
  const serialized = {
    id: action.get('api_id'),
    themeId: action.related('theme').get('api_id')
  };

  const include = options.include || req.query.include || [];

  if (includes(include, 'theme')) {
    serialized.theme = serializeTheme(req, action.related('theme'));
  }

  action.serializeTo(serialized, [ 'title', 'description', 'created_at', 'updated_at' ]);

  return serialized;
};
