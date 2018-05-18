/**
 * Actions management API.
 *
 * @module server/api/actions
 */
const serialize = require('express-serializer');
const { eagerLoading } = require('orm-query-builder');

const Action = require('../../models/action');
const { fetcher, route } = require('../utils/api');
const { sorting } = require('../utils/query-builder');
const { validateValue } = require('../utils/validation');
const policy = require('./actions.policy');

/**
 * List all existing relations for an action.
 * (This is used when validating an include query parameter and loading an single action)
 */
const EXISTING_RELATIONS = [ 'theme' ];

// API resource name (used in some API errors)
exports.resourceName = 'action';

/**
 * List actions ordered by name.
 *
 * @function
 */
exports.list = route(async (req, res) => {

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
 * Retrives a single Action
 * Includes all loaded relations to the serialized object.
 *
 * @function
 */
exports.retrieve = route(async (req, res) => {
  res.send(await serialize(req, req.action, policy, { include: EXISTING_RELATIONS }));
});

/**
 * Middleware that fetches the action identified by the ID in the URL.
 * Loads all existing relations for this action.
 *
 * @function
 */
exports.fetchAction = fetcher({
  model: Action,
  resourceName: exports.resourceName,
  coerce: id => id.toLowerCase(),
  validate: 'uuid',
  eagerLoad: EXISTING_RELATIONS
});

/**
 * Validates the query parameters of a request to list actions.
 *
 * @param {Request} req - An Express request object.
 * @returns {Promise<ValidationErrorBundle>} - A promise that will be resolved if the request is valid, or rejected with a bundle of errors if it is invalid.
 */
function validateListRequest(req) {
  return validateValue(req, 400, function() {
    return this.parallel(
      this.validatePaginationQueryParams(),
      this.multiQueryParamInclusion('include', ...EXISTING_RELATIONS),
    );
  });
}
