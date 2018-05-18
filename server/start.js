const http = require('http');

const config = require('../config');
const app = require('./app');

const logger = config.logger('www');

// Create an HTTP server.
const server = http.createServer(app);

// Function that opens a connection to the database, then starts the server.
module.exports = function() {
  return app.get('db').open().then(() => {

    // Set the port to connect to.
    app.set('port', config.port);

    // Listen on the provided port, on all network interfaces.
    server.listen(app.get('port'));
    server.on('error', onError);
    server.on('listening', onListening);
  }).catch(err => fail(err));
};

/**
 * Event listener for HTTP server "error" event.
 *
 * @param {Error} error - The error event.
 */
function onError(error) {
  if (error.syscall !== 'listen') {
    throw error;
  }

  const port = app.get('port');
  const bind = typeof port === 'string' ? `Pipe ${port}` : `Port ${port}`;

  // Handle specific errors with friendly messages
  switch (error.code) {
    case 'EACCES':
      fail(`${bind} requires elevated privileges`);
      break;
    case 'EADDRINUSE':
      fail(`${bind} is already in use`);
      break;
    default:
      fail(error);
  }
}

/**
 * Event listener for the HTTP server's "listening" event.
 */
function onListening() {

  const addr = server.address();
  const bind = typeof addr === 'string' ? `Pipe ${addr}` : `port ${addr.port}`;

  logger.info(`Listening on ${bind}`);
}

/**
 * Logs an error message at the FATAL level and exits the process with status 1.
 *
 * @param {string} message - A description of the error.
 */
function fail(message) {
  logger.fatal(message);
  process.exit(1);
}
