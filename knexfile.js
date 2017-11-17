const config = require('./config');

module.exports = {
  development: {
    client: 'postgresql',
    connection: config.db
  },

  production: {
    client: 'postgresql',
    connection: config.db
  }
};
