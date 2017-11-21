/**
 * Generic data transformation utilities.
 *
 * @module utils/data
 */
const _ = require('lodash');

/**
 * Returns the specific value unchanged if it's an array, wrapped into an array otherwise.
 *
 *     toArray([ 1, 2, 3 ]);        // => [ 1, 2, 3 ]
 *     toArray(2);                  // => [ 2 ]
 *     toArray(undefined);          // => [ undefined ]
 *     toArray(undefined, true);    // => []
 *     toArray([ 1, null ], true);  // => [ 1 ]
 *
 * @param {*} value - The value to wrap into an array.
 * @param {boolean} compact - If true, all falsy values (e.g. undefined) will be removed from the resulting array.
 * @returns {array} An array of values.
 */
exports.toArray = function(value, compact = false) {
  const array = _.isArray(value) ? value : [ value ];
  return compact ? _.compact(array) : array;
};
