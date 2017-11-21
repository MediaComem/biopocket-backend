const _ = require('lodash');
const config = require('../config');
const { logger: knexLogger } = require('../server/utils/knex');

const logger = config.logger('db');

exports.logMigration = function(knex) {
  logger.trace('BEGIN;');
  knex.on('query', knexLogger);
};
