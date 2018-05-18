const { serialize: serializeTheme } = require('../themes/theme.policy');

/**
 * Anyone can list actions.
 *
 * @function
 * @name canList
 * @memberof module:server/api/actions
 * @returns {boolean} true if user can list, false otherwise
 */
exports.canList = function() {
  return true;
};

/**
 * Serializes an action for API responses.
 *
 * @function
 * @memberof module:server/api/actions
 *
 * @param {Request} req - The Express request object.
 * @param {Action} action - An action record.
 * @returns {Object} A serialized action.
 */
exports.serialize = function(req, action) {
  const serialized = {
    id: action.get('api_id'),
    themeId: action.related('theme').get('api_id')
  };

  if (req.query.include) {
    serialized.theme = serializeTheme(req, action.related('theme'));
  }

  action.serializeTo(serialized, [ 'title', 'description', 'created_at', 'updated_at' ]);

  return serialized;
};
