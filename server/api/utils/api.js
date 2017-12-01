/**
 * API utilities.
 *
 * @module server/api/utils/api
 */
const _ = require('lodash');

const db = require('../../db');
const errors = require('./errors');

/**
 * Creates a middleware function that will fetch the record identified by the
 * current URL and attach it to the request. If no record is found, an HTTP 404
 * Not Found response will be sent.
 *
 *     const fetcher = require('./fetcher');
 *     const User = require('./models/user');
 *
 *     const fetchUser = fetcher({
 *       model: User,
 *       resourceName: 'user'
 *     });
 *
 *     router.get('/api/users/:id', fetchUser, (req, res) => {
 *       // req.user has been fetched, or HTTP 404 not found sent
 *       res.send(req.user);
 *     });
 *
 * @param {object} options - Fetcher options.
 *
 * @param {function} options.model - The database model to use to fetch the resource.
 *
 * @param {string} options.resourceName - The name of the API resource (used in error messages).
 *
 * @param {string} [options.column] - The database column containing the identifier (defaults to `api_id`).
 *
 * @param {string} [options.urlParameter] - The URL parameter containing the resource identifier (defaults to `id`).
 *
 * @param {function} [options.queryHandler] - An optional function to modify the database query (it will receive
 *   the query and the request as arguments, and should return the updated query).
 *
 * @param {string} [options.requestProperty] - The request property to attach the fetched record to (defaults to `options.resourceName`).
 *
 * @param {string[]} [options.eagerLoad] - Relations to eager-load when fetching the resource.
 *
 * @returns {function} A middleware function.
 */
exports.fetcher = function(options) {
  if (!_.isObject(options)) {
    throw new Error('An options object is required');
  } else if (!_.isFunction(options.model)) {
    throw new Error('The "model" option must be a database model');
  } else if (_.has(options, 'queryHandler') && !_.isFunction(options.queryHandler)) {
    throw new Error('The "queryHandler" option must be a function');
  } else if (!_.isString(options.resourceName)) {
    throw new Error('The "resourceName" option must be a string (e.g. the name of the model)');
  } else if (_.has(options, 'requestProperty') && !_.isString(options.requestProperty)) {
    throw new Error('The "requestProperty" option must be a string');
  }

  const Model = options.model;
  const column = options.column || 'api_id';
  const urlParameter = options.urlParameter || 'id';
  const queryHandler = options.queryHandler;
  const resourceName = options.resourceName;
  const requestProperty = options.requestProperty || resourceName;
  const eagerLoad = options.eagerLoad || [];

  let validate = () => true;
  if (options.validate == 'uuid') {
    validate = id => !!id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
  } else if (_.isFunction(options.validate)) {
    validate = options.validate;
  } else if (options.validate !== undefined) {
    throw new Error('The "validate" option must be a function or the string "uuid"');
  }

  let coerce = value => value;
  if (_.isFunction(options.coerce)) {
    coerce = options.coerce;
  } else if (options.coerce !== undefined) {
    throw new Error(`The "coerce" option must be a function`);
  }

  return function(req, res, next) {
    Promise.resolve().then(async () => {

      const resourceId = req.params[urlParameter];

      // Make sure the ID is valid.
      const resourceIdValid = await Promise.resolve(validate(resourceId));
      if (!resourceIdValid) {
        throw errors.recordNotFound(resourceName, resourceId);
      }

      // Coerce the ID.
      const coercedResourceId = await Promise.resolve(coerce(resourceId));

      // Prepare the query to fetch the record.
      let query = new Model({ [column]: coercedResourceId });

      // Pass the query through the handler (if any).
      if (_.isFunction(queryHandler)) {
        query = queryHandler(query, req);
      }

      // Perform the query.
      const record = await query.fetch({ withRelated: eagerLoad })
      if (!record) {
        throw errors.recordNotFound(resourceName, resourceId);
      }

      // Attach the record to the request object.
      req[requestProperty] = record;
    }).then(next).catch(next);
  };
}

/**
 * Converts a promise-based function into an Express middleware function.
 *
 *     route(async (req, res) => {
 *
 *       // Asynchronous code
 *       const data = await fetchData();
 *
 *       // Errors caught by promise chain and automatically passed to next(err)
 *       if (!data) {
 *         throw new Error('No data available');
 *       }
 *
 *       res.send(data);
 *     });
 *
 * @param {function} routeFunc - The asynchronous route implementation.
 *
 * @returns {function} A middleware function.
 */
exports.route = function makeRoute(routeFunc) {
  return function(req, res, next) {
    Promise.resolve().then(() => routeFunc(req, res, next)).catch(next);
  };
};

/**
 * Converts a promise-based function into an Express middleware function (like
 * `route`), and wraps the route into a database transaction.
 *
 * Any error thrown will cause the transaction to be rolled back.
 *
 *     transactionalRoute(async (req, res) => {
 *
 *       // Asynchronous code
 *       const user = await fetchUser();
 *
 *       // Any error will roll back the transaction.
 *       await user.save(req.body);
 *
 *       res.send(user);
 *     });
 *
 * @param {function} routeFunc - The asynchronous route implementation.
 *
 * @returns {function} A middleware function.
 */
exports.transactionalRoute = function makeTransactionalRoute(routeFunc) {
  return makeRoute(function(req, res, next) {
    return db.transaction(() => routeFunc(req, res, next));
  });
};
