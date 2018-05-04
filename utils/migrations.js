/**
 * General utilities.
 *
 * @module utils
 */
const _ = require('lodash');
const config = require('../config');

const logger = config.logger('db');

/**
 * Configures a knex instance to log queries during a migration.
 *
 * Pass the `knex` argument of a migration's `up` or `down` function to this
 * function to start logging.  It should be the first thing you do. As the
 * migration will have started before entering `up` or `down`, this function
 * will immediately log `BEGIN;` to show the transaction that was already
 * started by knex. All further queries (including `COMMIT;` or `ROLLBACK;`)
 * will be logged.
 *
 *     const { logMigration } = require('../utils/migrations');
 *
 *     exports.up = function(knex) {
 *       logMigration(knex);
 *       // Migrate stuff...
 *     };
 */
exports.logMigration = function(knex) {
  logger.trace('BEGIN;');
  knex.on('query-response', (res, obj, builder) => logger.trace(builder.toString()));
};
