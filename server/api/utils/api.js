/**
 * API utilities.
 *
 * @module server/api/utils/api
 */
const serialize = require('express-serializer');
const _ = require('lodash');

const db = require('../../db');
const errors = require('./errors');

/**
 * Returns the specified object without all properties equal to null or
 * undefined (recursively, including arrays).
 *
 * Named after Lodash's compact function ({@link
 * https://lodash.com/docs/4.17.11#compact}).
 *
 * @param {*} json - An array, object or value to be serialized to JSON.
 * @returns {*} The compacted value.
 */
exports.compactDeep = function(json) {
  if (_.isArray(json)) {
    return json.map(value => exports.compactDeep(value));
  } else if (_.isPlainObject(json)) {
    return _.reduce(json, (memo, value, key) => {
      if (value !== null && value !== undefined) {
        memo[key] = exports.compactDeep(value);
      }

      return memo;
    }, {});
  } else {
    return json;
  }
};

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
 * @param {Object} options - Fetcher options.
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
 * @param {string|function} [options.validate] - A function that will be used to validate the resourceId. If you need to validate that the resourceId is a UUID, you can simply pass the string `'uuid'`.
 *
 * @param {function} [options.coerce] - A function that will be used to apply some changes on the resourceId's value **before** querying the database.
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
  if (options.validate === 'uuid') {
    validate = id => Boolean(id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i));
  } else if (_.isFunction(options.validate)) {
    validate = options.validate;
  } else if (options.validate !== undefined) {
    throw new Error('The "validate" option must be a function or the string "uuid"');
  }

  let coerce = value => value;
  if (_.isFunction(options.coerce)) {
    coerce = options.coerce;
  } else if (options.coerce !== undefined) {
    throw new Error('The "coerce" option must be a function');
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
      const record = await query.fetch({ withRelated: eagerLoad });
      if (!record) {
        throw errors.recordNotFound(resourceName, resourceId);
      }

      // Attach the record to the request object.
      req[requestProperty] = record;
    }).then(next).catch(next);
  };
};

/**
 * Returns a URL formed by joining the specified URL fragments together.
 *
 * Leading and trailing slashes are removed before joining the fragments with a
 * single slash. If a fragment starts with `http://`, `https://` or `//`, all
 * preceding fragments are ignored.
 *
 * @example
 * joinUrl('http://example.com/', '/foo/', 'bar/', 'baz'); // "http://example.com/foo/bar/baz"
 * joinUrl('http://example.com', '/foo', 'http://other.com', 'bar'); // "http://other.com/bar"
 * joinUrl('http://example.com', '/foo', '//protocol/relative/url'); // "//protocol/relative/url"
 *
 * @param {...string} parts - URL fragments to join.
 * @returns {string} An absolute URL.
 */
exports.joinUrl = function(...parts) {
  return parts.reduce((memo, part) => {
    if (part.match(/^(https?:)?\/\//)) {
      return part;
    } else {
      return `${memo.replace(/\/$/, '')}/${part.replace(/^\//, '')}`;
    }
  });
};

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
exports.route = function(routeFunc) {
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
exports.transactionalRoute = function(routeFunc) {
  return exports.route(function(req, res, next) {
    return db.transaction(() => routeFunc(req, res, next));
  });
};

/**
 * Creates a middleware function that handles calls with HTTP methods that are not allowed on the resource.
 * This middelware function will generate a 405 HTTP methods with an Allow headers listing allowed methods.
 *
 * @param {array} allowedMethods - An array of allowed HTTP methods
 * @returns {function} The middleware function
 */
exports.allowsOnlyMethod = function(allowedMethods) {
  return exports.route(function(req, res, next) {
    next(errors.methodNotAllowed(allowedMethods));
  });
};

/**
 * Serializes data using {@link https://github.com/MediaComem/express-serializer|express-serializer}.
 *
 * If the `data` argument is a Bookshelf collection, its `models` property (a native array of the
 * models it contains) is extracted as the data to serialize, since express-serializer isn't aware
 * of Bookshelf.
 *
 * @param {Request} req - An Express request object.
 * @param {Array|Object} data - The data to serialize.
 * @param {Function|Object} serializer - A serializer function or an object that has a `serialize` function.
 * @param {Object} options - Serialization options.
 * @returns {Array|Object} The serialized data.
 * @see https://github.com/MediaComem/express-serializer
 */
exports.serialize = function(req, data, serializer, options) {
  return serialize(req, data instanceof db.bookshelf.Collection ? data.models : data, serializer, options);
};
