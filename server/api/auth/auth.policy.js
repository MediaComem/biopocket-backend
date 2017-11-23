/**
 * Anyone can attempt to authenticate. Always returns true.
 *
 * @function
 * @name canAuthenticate
 * @memberof module:server/api/auth
 * @returns {boolean}
 */
exports.canAuthenticate = function(req) {
  return true;
};
