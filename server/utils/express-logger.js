const config = require('../../config');
const log4js = require('log4js');

const logger = config.logger('express');

module.exports = log4js.connectLogger(logger, {
  level: log4js.levels.TRACE,
  format: ':method :url :status :response-time ms'
});
