const config = require('../config');

exports.logQueries = function(knex, logger) {

  // Log queries in development & test environments only.
  if (config.env !== 'development' && config.env !== 'test') {
    return;
  }

  knex.on('query', data => {
    if (data.sql.match(/^\s*(BEGIN|COMMIT|ROLLBACK)\s*;\s*$/i)) {
      logger.trace(data.sql);
    }
  });

  knex.on('query-response', (res, obj, builder) => logger.trace(builder.toString()));
};
