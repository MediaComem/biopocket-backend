// Cross-Origin Resource Sharing (CORS)
// It is disabled by default.
exports.cors = false;

// Database URL
// The full format is "postgres://username:password@host:port/dbname"
exports.db = 'postgres://localhost/biopocket';

// Documentation development options
exports.docs = {
  //browser: 'Google Chrome',
  host: '127.0.0.1',
  open: true,
  port: undefined // Will find a free random port by default.
};

// Application environment
exports.env = 'development'

// Log level (TRACE, DEBUG, INFO, WARN, ERROR or FATAL)
// Use TRACE for development to log database queries and HTTP requests.
exports.logLevel = 'TRACE';

// Port to run the server on
exports.port = 3000;

// Session secret used to sign JWT tokens
// This should be a long random string, e.g. 100 characters.
exports.sessionSecret = 'changeme';
