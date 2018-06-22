/**
 * Anyone can attempt to authenticate.
 *
 * @function
 * @name canAuthenticate
 * @memberof module:server/api/auth
 *
 * @returns {boolean} True if authorized.
 */
exports.canAuthenticate = function() {
  return true;
};
