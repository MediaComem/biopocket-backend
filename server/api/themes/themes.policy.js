/**
 * Anyone can retrieve a theme.
 *
 * @function
 * @name canRetrieve
 * @memberof module:server/api/theme
 *
 * @returns {boolean} `true` if user can retrieve, `false` otherwise
 */
exports.canRetrieve = function() {
  return true;
};

/**
 * Serializes a theme for API response.
 *
 * @function
 * @name serialize
 * @memberof module:server/api/theme
 *
 * @param {Request} req - The Express request object.
 * @param {*} theme - A theme record.
 * @returns {Object} A serialized theme.
 */
exports.serialize = function(req, theme) {
  const serialized = {
    id: theme.get('api_id')
  };

  theme.serializeTo(serialized, [ 'title', 'description', 'photo_url', 'source', 'created_at', 'updated_at' ]);

  return serialized;
};
