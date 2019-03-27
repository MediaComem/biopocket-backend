/**
 * General utilities.
 *
 * @module utils/migration
 */
const config = require('../config');
const { logQueries } = require('./knex');

const logger = config.logger('db');

const logEnabled = Symbol('logEnabled');

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
 *
 * @param {Knex} knex - The Knex instance used to perform the migration.
 */
exports.logMigration = function(knex) {
  if (!knex[logEnabled]) {
    logger.trace('BEGIN;');
    logQueries(knex, logger);
  }
  knex[logEnabled] = true;
};

/**
 * Adds the two touch columns to the given table :
 * * `created_at` - timestamp, not null, unique
 * * `updated_at` - timestamp, not null, unique
 *
 * @param {Object} table - A Knex object representing the table
 */
exports.addTouchColumnsOn = function(table) {
  table.timestamp('created_at', true).notNullable().index();
  table.timestamp('updated_at', true).notNullable().index();
};
