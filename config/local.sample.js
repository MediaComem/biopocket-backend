// Cross-Origin Resource Sharing (CORS)
// It is disabled by default.
exports.cors = false;

// Database URL
// The full format is "postgres://username:password@host:port/dbname"
exports.db = 'postgres://localhost/biopocket';

// Database URL for the test environment
// You should use a different database for tests as all its data will
// be deleted when running the tests.
if (process.env.NODE_ENV === 'test') {
  exports.db = 'postgres://localhost/biopocket-test';
}

// Documentation development options
exports.docs = {
  // Uncomment this if you want to use another browser than your system's default
  // browser: 'Google Chrome',
  host: '127.0.0.1',
  open: true,
  port: undefined // Will find a free random port by default.
};

// Application environment
exports.env = 'development';

// Base URL where theme, action and task images are stored (e.g. Amazon S3 bucket).
exports.imagesBaseUrl = 'https://example.com';

// Log level (TRACE, DEBUG, INFO, WARN, ERROR or FATAL)
// Use TRACE for development to log database queries and HTTP requests.
exports.logLevel = 'TRACE';

// Port to run the server on
exports.port = 3000;

// Session secret used to sign JWT tokens
// This should be a long random string, e.g. 100 characters.
exports.sessionSecret = 'changeme';

// Default pagination limit when listing resources with pagination feature
exports.defaultPaginationLimit = 100;
