/**
 * Users management API.
 *
 * @module server/api/users
 */
const _ = require('lodash');
const serialize = require('express-serializer');

const User = require('../../models/user');
const { fetcher, route } = require('../utils/api');
const errors = require('../utils/errors');
const policy = require('./users.policy');

// API resource name (used in some API errors)
exports.resourceName = 'user';

/**
 * **GET /api/me** & **GET /api/users/:id**
 *
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
  resourceName: 'user'
});

/**
 * Middleware that attaches the authenticated user to the request in a similar manner to `fetchUser`.
 *
 * @function
 */
exports.fetchMe = function(req, res, next) {
  req.user = req.currentUser;
  next();
};
