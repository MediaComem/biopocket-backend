/**
 * @module server/spec/utils/functions
 */
const { isArray, isInteger } = require('lodash');
const moment = require('moment');

/**
 * Transforms the specified value into an array if it isn't one already.
 *
 * @example
 * toArray(true);       // => [ true ]
 * toArray(2);          // => [ 2 ]
 * toArray([ 3, 4 ]);   // => [ 3, 4 ]
 * toArray(undefined);  // => [ undefined ]
 *
 * @param {*} value - The value to transform.
 * @returns {Array} An array.
 */
exports.toArray = function(value) {
  return isArray(value) ? value : [ value ];
};

/**
 * Converts a date value to an ISO-8601 string.
 *
 * @param {number|Date|Moment} value - The value to convert. If it's an integer,
 *   it's assumed to be a unix timestamp in seconds.
 * @returns {string} An ISO-8601 date string.
 */
exports.toIso8601 = function(value) {
  if (isInteger(value) && value >= 1) {
    return moment.unix(value).toISOString();
  } else if (value instanceof Date || moment.isMoment(value)) {
    return moment(value).toISOString();
  } else {
    throw new Error(`Value "${value}" (type ${typeof value}) must be a date, a moment, or a UNIX timestamp (in seconds)`);
  }
};

/**
 * Converts a date value to a Unix timestamp in seconds.
 *
 * @param {number|Date|Moment} value - The value to convert. If it's an integer
 *   greater than or equal to 1, it's assumed to already be a Unix timestamp and
 *   is returned as is.
 * @returns {number} A Unix timestamp in seconds.
 */
exports.toTimestamp = function(value) {
  if (isInteger(value) && value >= 1) {
    return value;
  } else if (value instanceof Date || moment.isMoment(value)) {
    return moment(value).unix();
  } else {
    throw new Error(`Value "${value}" (type ${typeof value}) must be a date, a moment, or a UNIX timestamp (in seconds)`);
  }
};
