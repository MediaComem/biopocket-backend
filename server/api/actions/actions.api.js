/**
 * Actions management API.
 *
 * @module server/api/actions
 */
const serialize = require('express-serializer');
const { isArray, uniq } = require('lodash');
const { eagerLoading } = require('orm-query-builder');

const Action = require('../../models/action');
const { route } = require('../utils/api');
const { sorting } = require('../utils/query-builder');
const { validateValue } = require('../utils/validation');
const policy = require('./actions.policy');

// API resource name (used in some API errors)
exports.resourceName = 'action';

/**
 * List actions ordered by name.
 *
 * @function
 */
exports.list = route(async (req, res) => {

  uniqueInclude(req);

  await validateListRequest(req);

  const builder = Action
    .paginatedQueryBuilder()
    .use(
      sorting()
        .sorts('title', 'createdAt')
        .default('title', 'createdAt')
    )
    .use(eagerLoading().load('theme'));

  const actions = await builder.execute({ req, res });

  res.send(await serialize(req, actions.models, policy));
});

/**
 * Validates the query parameters of a request to list actions.
 *
 * @param {Request} req - An Express request object.
 * @returns {Promise<ValidationErrorBundle>} - A promise that will be resolved if the request is valid, or rejected with a bundle of errors if it is invalid.
 */
function validateListRequest(req) {
  const EXISTING_RELATIONS = [ 'theme' ];

  return validateValue(req, 400, function() {
    return this.parallel(
      this.validatePaginationQueryParams(),
      this.multiQueryParamInclusion('include', ...EXISTING_RELATIONS),
    );
  });
}

/**
 * Mutates the given Express request so that its include query parameter only contains unique values.
 * This is of course only done if the request actually contains an include query parameter, and that it is an array.
 *
 * @private
 * @param {Request} req - An Express request object
 */
function uniqueInclude(req) {

  const include = req.query.include;

  if (include && isArray(include)) {
    req.query.include = uniq(include);
  }

}
