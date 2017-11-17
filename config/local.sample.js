// Set to true to enable Cross-Origin Resource Sharing (CORS)
exports.cors = false;

// Database URL (postgres://username:password@host:port/dbname)
exports.db = 'postgres://localhost/biopocket';

// Application environment
exports.env = 'development'

// Log level (TRACE, DEBUG, INFO, WARN, ERROR or FATAL)
// Database queries and HTTP requests are only logged if the log level is TRACE.
exports.logLevel = 'TRACE';

// Port to run the server on
exports.port = 3000;
