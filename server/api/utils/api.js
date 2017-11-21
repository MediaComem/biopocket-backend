/**
 * API utilities.
 *
 * @module api/utils/api
 */
const _ = require('lodash');

const db = require('../../db');
const { toArray } = require('../../utils/data');
const { ensureRequest } = require('../../utils/express');
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

  return function(req, res, next) {

    const resourceId = req.params[urlParameter];

    // Prepare the query to fetch the record
    let query = new Model({ [column]: resourceId });

    // Pass the query through the handler (if any)
    if (_.isFunction(queryHandler)) {
      query = queryHandler(query, req);
    }

    // Perform the query
    query.fetch({ withRelated: eagerLoad }).then(function(record) {
      if (!record) {
        throw errors.recordNotFound(resourceName, resourceId);
      }

      // Attach the record to the request object
      req[requestProperty] = record;
    }).then(next, next);
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

/**
 * Serializes data with a serializer function.
 *
 *     const { serializer } = require('./utils/api');
 *
 *     // Write your serialization function.
 *     function serializeUser(req, user, options) {
 *       return {
 *         name: `${user.firstName} ${user.lastName}`,
 *         age: user.age,
 *         options: options
 *       };
 *     }
 *
 *     // Call the serializer with an object to serialize and your function:
 *     const user = await fetchUser();
 *     serializer(req, user, serializeUser, { foo: 'bar' }).then(serialized => {
 *       console.log(serialized);
 *       // {
 *       //   name: 'John Doe',
 *       //   age: 42,
 *       //   options: { foo: 'bar' }
 *       // }
 *     });
 *
 *     // You can do the same with an array of objects:
 *     const users = await Promise.all([ fetchUser(1), fetchUser(2) ]);
 *     serializer(req, users, serializeUser, { foo: 'bar' }).then(serialized => {
 *       console.log(serialized);
 *       // [
 *       //   {
 *       //     name: 'John Doe',
 *       //     age: 42,
 *       //     options: { foo: 'bar' }
 *       //   },
 *       //   {
 *       //     name: 'John Smith',
 *       //     age: 24,
 *       //     options: { foo: 'bar' }
 *       //   }
 *       // ]
 *     });
 *
 * If the request has one or multiple `only` and/or `except` query parameters, they
 * behave like the `only` and `except` options documented below. If both query
 * parameters and options are present (e.g. for `only`), the two lists are merged
 * together.
 *
 * @param {Request} req - The Express request object.
 *
 * @param {(object|object[])} data - The object or array of objects to serialize (e.g. database records).
 *
 * @param {(function|object)} serializer - A function (or an object with a "serialize"
 *   property that is a function) that will be called with one object to serialize and
 *   should return a serialized version of that object. If the data to serialize is an
 *   array, this function will be called once for each object in the array. The function
 *   will be passed 3 arguments: the Express request object, the item to serialize, and
 *   any additional serialization options.
 *
 * @param {object} [options] - Serialization options passed to the serialize function.
 *
 * @param {string|string[]} [options.only] - Whitelist of properties to include in the
 *   serialized object (any other extra properties will be excluded).
 *
 * @param {string|string[]} [options.except] - Blacklist of properties not to include in
 *   the serialized object. Note that properties in this list will not be included even
 *   if they are listed in `only`.
 *
 * @returns {Promise<object|object[]>} - A promise of the serialized object(s).
 */
exports.serialize = function(req, data, serializer, options) {
  ensureRequest(req);

  if (_.isFunction(serializer.serialize)) {
    serializer = serializer.serialize;
  } else if (!_.isFunction(serializer)) {
    throw new Error('Serializer must be a function or have a "serialize" property that is a function');
  }

  if (!_.isArray(data)) {
    return Promise.resolve(serializer(req, data, options)).then(result => filterData(req, result, options));
  } else {
    return Promise.all(data.map(item => serializer(req, item, options))).then(result => result.map(result => filterData(req, result, options)));
  }
};

function filterData(req, data, options) {

  let exceptFromOptions = toArray(_.get(options, 'except', []), true);
  let exceptFromRequest = toArray(req.query.except, true);
  let except = _.union(exceptFromOptions, exceptFromRequest);

  let onlyFromOptions = toArray(_.get(options, 'only', []), true);
  let onlyFromRequest = toArray(req.query.only, true);
  let only = _.union(onlyFromOptions, onlyFromRequest);

  if (!only.length && !except.length) {
    return data;
  }

  if (only) {
    data = _.pick(data, ...only);
  }

  if (except) {
    data = _.omit(data, ...except);
  }

  return data;
}
