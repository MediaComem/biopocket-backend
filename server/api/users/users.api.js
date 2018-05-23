/**
 * Users management API.
 *
 * @module server/api/users
 */
const serialize = require('express-serializer');

const User = require('../../models/user');
const { fetcher, route } = require('../utils/api');
const policy = require('./users.policy');

// API resource name (used in some API errors)
exports.resourceName = 'user';

/**
 * Retrieves a single user.
 *
 * @function
 */
exports.retrieve = route(async function(req, res) {
  res.send(await serialize(req, req.user, policy));
});

/**
 * Middleware that fetches the user identified by the ID in the URL.
 *
 * @function
 */
exports.fetchUser = fetcher({
  model: User,
  resourceName: exports.resourceName,
  coerce: id => id.toLowerCase(),
  validate: 'uuid'
});

/**
 * Middleware that attaches the authenticated user to the request in a similar manner to `fetchUser`.
 *
 * @function
 * @param {Request} req - The Express request object.
 * @param {Response} res - The Express response object.
 * @param {function} next - A function to call the next Express middleware.
 */
exports.fetchMe = function(req, res, next) {
  req.user = req.currentUser;
  next();
};
