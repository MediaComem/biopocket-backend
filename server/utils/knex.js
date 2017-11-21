/**
 * Knex-related utilities.
 *
 * @module utils/knex
 * @see http://knexjs.org
 */
const _ = require('lodash');
const config = require('../../config');

const logger = config.logger('db');

/**
 * A logger function that can be passed to knex to log all database queries.
 *
 * @function
 * @param {*} query - A knex query.
 */
exports.logger = function(query) {
  let message = query.sql;

  if (query.bindings) {
    query.bindings.forEach((binding, i) => {
      message = message.replace(new RegExp(`\\$${i + 1}`), logValue(binding));
    });
  }

  if (!message.match(/;$/)) {
    message = message + ';';
  }

  logger.trace(message);
}

function logValue(value) {
  if (value === undefined) {
    return 'undefined';
  }

  if (value instanceof Buffer) {
    value = value.toString('hex');
  } else {
    value = JSON.stringify(value);
  }

  if (value.length > 50) {
    value = `${value.substring(0, 50)}...`;

    if (value.match(/^"/)) {
      value = `${value}"`;
    }
  }

  return value;
}
