const _ = require('lodash');
const config = require('../config');
const knexLogger = require('../server/utils/knex-logger');

const logger = config.logger('db');

exports.logMigration = function(knex) {
  logger.trace('BEGIN;');
  knex.on('query', knexLogger);
};
