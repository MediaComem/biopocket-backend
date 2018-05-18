/**
 * Utilities to work with parameter values (e.g. from query parameters).
 *
 * @module server/api/utils/params
 */
const { constant, identity, isArray, uniq } = require('lodash');

/**
 * Normalizes a value that should be an array:
 *
 * * If no value is given, returns an empty array.
 * * If one value is given, wraps it into an array.
 * * Pass values through the specified coercion function (returns values unchanged by default).
 * * Return only values that pass the specified predicate (matches all values by default).
 * * Return only unique values.
 *
 * @example
 * multiValue();    // []
 * multiValue(42);  // [ 42 ]
 * multiValue([ 12, true ], String);  // [ '12', 'true' ]
 * multiValue([ 'foo', 'bar' ], String, value !== 'foo');  // [ 'bar' ]
 * multiValue([ 'foo', 'foo', 'bar' ]);  // [ 'foo', 'bar' ]
 *
 * @param {*} value - The value to normalize.
 * @param {Function} [coerce] - An optional function to coerce each value (e.g. make sure they are strings).
 * @param {Function} [predicate] - An optional predicate to filter the values.
 * @returns {Array} - An array of normalized values.
 */
exports.multiValue = function(value, coerce = identity, predicate = constant(true)) {
  if (value === undefined) {
    return [];
  }

  const arrayValue = isArray(value) ? value : [ value ];
  return uniq(arrayValue.map(coerce).filter(predicate));
};

/**
 * Normalizes a single value:
 *
 * * Returns undefined if the value is undefined.
 * * Otherwise, pass it through the specified coercion function (returns the value unchanged by default).
 *
 * @example
 * singleValue();              // undefined
 * singleValue(42);            // 42
 * singleValue(true, String);  // "true"
 *
 * @param {*} value - The value to normalize.
 * @param {Function} [coerce] - An optional function to coerce the value (e.g. make sure it is a string).
 * @returns {*} - The normalized value.
 */
exports.singleValue = function(value, coerce = identity) {
  return value === undefined ? undefined : coerce(value);
};
