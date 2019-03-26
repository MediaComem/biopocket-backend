/**
 * Utilities to make complex database queries, mostly related to {@link https://github.com/MediaComem/orm-query-builder|ORM Query Builder}.
 *
 * @module server/api/utils/query-builder
 * @see {@link https://github.com/MediaComem/orm-query-builder}
 */
const { underscore } = require('inflection');
const { defaults } = require('lodash');
const { OrmQueryBuilder, pagination, sorting } = require('orm-query-builder');

const { defaultPaginationLimit } = require('../../../config');
const { isRequest, isResponse } = require('../../utils/express');
const { multiValue, singleValue } = require('./params');

/**
 * Returns an ORM Query Builder pre-configured for this application:
 *
 * * Ensures that the Express request and response have been passed to the query builder
 *   (e.g. to read query params or set response headers).
 *
 * @param {Object} options - Builder options.
 * @returns {OrmQueryBuilder} A query builder.
 */
exports.queryBuilder = function(options) {
  return new OrmQueryBuilder(options).before('start', context => {
    const { req, res } = context.options;
    if (!req) {
      throw new Error('The Express request must be passed to the query builder as the "req" option at construction or execution');
    } else if (!isRequest(req)) {
      throw new Error('The "req" option passed to the query builder does not appear to be an Express request object');
    } else if (!res) {
      throw new Error('The Express response must be passed to the query builder as the "res" option at construction or execution');
    } else if (!isResponse(res)) {
      throw new Error('The "res" option passed to the query builder does not appear to be an Express response object');
    }
  });
};

/**
 * Returns an object that can be used as an ORM Query Builder middleware function or plugin to
 * conditionally filter a database query (e.g. find all users with matching first name).
 *
 * When used as a plugin, the filter is applied before the query builder's "paginate" stage.
 *
 * @example
 * const builder = new OrmQueryBuilder();
 * const getEmail = context => context.options.req.query.email;
 * const filterByEmail = (query, value) => query.where('email', value);
 *
 * // Use as a plugin
 * builder.use(filter(getEmail, filterByEmail));
 *
 * // Use as a query middleware function
 * builder.before('end', filter(getEmail, filterByEmail));
 *
 * @param {Function} valueFunc - A function that should return the value used to filter.
 *                               It will receive the query builder's execution context (with
 *                               the Express request retrievable as `context.options.req`, e.g.
 *                               to get query parameters).
 * @param {Function} filterFunc - A function that should filter the query with the value.
 *                                It will receive 3 arguments: the query, the filter value, and
 *                                the query builder's execution context. It should return the
 *                                updated query.
 * @returns {Object} An ORM Query Builder middleware function and plugin.
 */
exports.filter = function(valueFunc, filterFunc) {

  // Build a middleware function that can be plugged into a query builder.
  const queryBuilderMiddleware = async function(context) {

    // Retrieve the filter value using the function given as first argument.
    const filterValue = await Promise.resolve(context).then(valueFunc);
    if (filterValue === undefined) {
      return; // Do not apply the filter if there is no value.
    }

    // Apply the filter function to the query, passing the filter value
    // (and the query builder execution context, in case it needs more information).
    const originalQuery = context.get('query');
    const modifiedQuery = filterFunc(originalQuery, filterValue, context);
    if (!modifiedQuery) {
      throw new Error('The filter function returned a falsy result');
    } else if (Object.getPrototypeOf(modifiedQuery) !== Object.getPrototypeOf(originalQuery)) {
      throw new Error('The modified query is not of the same type');
    }

    // Update the builder with the filtered query.
    context.set('query', modifiedQuery);
  };

  // Return a function that is both a query builder middleware and a plugin for maximum flexibility.
  // As a middleware, it can be plugged before or after any stage; as a plugin, it is automatically
  // plugged before the "paginate" stage.
  queryBuilderMiddleware.use = builder => builder.before('paginate', queryBuilderMiddleware);

  return queryBuilderMiddleware;
};

/**
 * Returns a function that can be called to extract a multi-value query parameter from the current
 * HTTP request. It is meant to be used with a query builder as it extracts the request from the
 * builder's execution context.
 *
 * The returned function returns undefined if the query parameter is not present.
 *
 * @param {string} name - The name of the query parameter to extract.
 * @param {Function} [coerce] - An optional function to coerce each value (e.g. make sure they are strings).
 * @param {Function} [predicate] - An optional predicate to filter the values.
 * @returns {Function} A query builder middleware function.
 */
exports.multiQueryParam = function(name, coerce, predicate) {
  return context => {
    const value = context.options.req.query[name];
    return value !== undefined ? multiValue(value, coerce, predicate) : undefined;
  };
};

/**
 * Returns a function that can be called to extract a single-value query parameter from the current
 * HTTP request. It is meant to be used with a query builder as it extracts the request from the
 * builder's execution context.
 *
 * The returned function returns undefined if the query parameter is not present.
 *
 * @param {string} name - The name of the query parameter to extract.
 * @param {Function} [coerce] - An optional function to coerce the value (e.g. make sure it is a string).
 * @returns {Function} A query builder middleware function.
 */
exports.singleQueryParam = function(name, coerce) {
  return context => {
    const value = context.options.req.query[name];
    return value !== undefined ? singleValue(value, coerce) : undefined;
  };
};

/**
 * Returns an ORM Query Builder pagination plugin pre-configured for this application:
 *
 * * The offset to apply for pagination is retrieved from the "offset" query parameter.
 * * The limit to apply for pagination is retrieved from the "limit" query parameter.
 * * The default limit is 100 (used if no limit or an invalid limit is specified).
 * * The maximum limit is 250.
 *
 * @example
 * new OrmQueryBuilder().use(pagination());
 *
 * @param {Object} options - Options for the pagination plugin.
 * @returns {Object} A pagination plugin that can be used with a query builder.
 *
 * @see {@link https://github.com/MediaComem/orm-query-builder#pagination}
 */
exports.pagination = function(options) {

  const baseOptions = {
    getOffset: 'options.req.query.offset',
    getLimit: 'options.req.query.limit',
    getDefaultLimit: () => defaultPaginationLimit,
    getMaxLimit: () => 250
  };

  const useCustomPagination = builder => {
    pagination(defaults(baseOptions, options)).use(builder);
    builder.after('end', context => {
      const paginationData = context.get('pagination');
      const res = context.options.res;
      res.set('Pagination-Offset', paginationData.offset);
      res.set('Pagination-Limit', paginationData.limit);
      res.set('Pagination-Total', paginationData.total);
      res.set('Pagination-Filtered-Total', paginationData.filteredTotal);
      res.set('Access-Control-Expose-Headers', 'Pagination-Offset, Pagination-Limit, Pagination-Total, Pagination-Filtered-Total');
    });
  };

  return { use: useCustomPagination };
};

/**
 * Returns an ORM Query Builder sorting plugin pre-configured for this application:
 *
 * * Sort parameters are retrieved from the "sort" query parameter (which may be specified multiple times).
 * * Simple sorts defined with the plugin's `sorts()` method convert the camel-case sort name to underscored
 *   column names (e.g. "firstName" => "first_name").
 *
 * @example
 * new OrmQueryBuilder().use(sorting());
 *
 * @param {Object} options - Options for the sorting plugin.
 * @returns {Object} A sorting plugin that can be used with a query builder.
 *
 * @see {@link https://github.com/MediaComem/orm-query-builder#sorting}
 */
exports.sorting = function(options) {

  const baseOptions = {
    // Retrieve the sort parameter(s) from the "sort" query parameter.
    getSort: 'options.req.query.sort',
    // Configure the query builder sorting plugin to convert sort names
    // to underscored column names by default.
    createSimpleSort: name => (direction, context) => query => {
      return context.adapter.orderQueryBy(query, underscore(name), direction, context);
    }
  };

  return sorting(defaults(baseOptions, options));
};
