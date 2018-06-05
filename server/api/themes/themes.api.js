/**
 * Themes managements API
 *
 * @module server/api/themes
 */
const Theme = require('../../models/theme');
const { fetcher, route, serialize } = require('../utils/api');
const policy = require('./themes.policy');

exports.resourceName = 'theme';

/**
 * Retrieves a single Theme
 *
 * @function
 */
exports.retrieve = route(async (req, res) => {
  res.send(await serialize(req, req.theme, policy));
});

/**
 * Middleware that fetches the theme identified by the ID in the URL.
 *
 * @function
 */
exports.fetchTheme = fetcher({
  model: Theme,
  resourceName: exports.resourceName,
  validate: 'uuid',
  coerce: id => id.toLowerCase()
});
