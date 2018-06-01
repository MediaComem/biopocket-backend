// This file exports a configuration object that is used throughout the
// application to customize behavior. That object is built from environment
// variables, an optional configuration file, and from default values.

const fs = require('fs');
const _ = require('lodash');
const log4js = require('log4js');
const path = require('path');

const SUPPORTED_ENVIRONMENTS = [ 'development', 'production', 'test' ];
const SUPPORTED_LOG_LEVELS = [ 'TRACE', 'DEBUG', 'INFO', 'WARN', 'ERROR', 'FATAL' ];

const pkg = require(path.join('..', 'package'));
const root = path.normalize(path.join(__dirname, '..'));

// Immutable configuration & utility functions
const fixedConfig = {
  logger: createLogger,
  root: root,
  version: pkg.version,
  path: joinProjectPath
};

// Configuration from environment variables
const configFromEnvironment = {
  bcryptCost: parseConfigInt(get('BCRYPT_COST')),
  cors: parseConfigBoolean(get('CORS')),
  db: get('DATABASE_URL') || buildDatabaseUrl(),
  defaultPaginationLimit: parseConfigInt(get('DEFAULT_PAGINATION_LIMIT')),
  docs: {
    browser: get('DOCS_BROWSER'),
    host: get('DOCS_HOST'),
    open: get('DOCS_OPEN'),
    port: get('DOCS_PORT')
  },
  env: process.env.NODE_ENV,
  logLevel: get('LOG_LEVEL'),
  port: parseConfigInt(get('PORT')),
  sessionSecret: get('SESSION_SECRET')
};

// Configuration from a local file (`config/local.js` by default, or `$CONFIG`)
let configFromLocalFile = {};
const localConfigFile = path.resolve(root, get('CONFIG') || path.join('config', 'local.js'));
if (localConfigFile !== joinProjectPath('config', 'local.js') && !fs.existsSync(localConfigFile)) {
  throw new Error(`No configuration file found at ${localConfigFile}`);
} else if (fs.existsSync(localConfigFile)) {
  const localConfig = require(localConfigFile);
  configFromLocalFile = _.pick(localConfig,
    'bcryptCost', 'cors', 'db', 'defaultPaginationLimit',
    'docs.browser', 'docs.host', 'docs.open', 'docs.port',
    'env', 'logLevel', 'port', 'sessionSecret');
}

// Default configuration
const defaultConfig = {
  bcryptCost: 10,
  cors: false,
  db: 'postgres://localhost/biopocket',
  defaultPaginationLimit: 100,
  docs: {
    host: '127.0.0.1',
    open: true,
    port: undefined
  },
  env: 'development',
  logLevel: 'INFO',
  port: 3000
};

// Environment variables take precedence over the configuration file, and both
// take precedence over the default configuration.
const config = _.merge({}, defaultConfig, configFromLocalFile, configFromEnvironment, fixedConfig);

validate(config);

const configLogger = config.logger('config');
configLogger.debug(`Environment is ${config.env} (change with $NODE_ENV or config.env)`);
configLogger.debug(`bcrypt cost is ${config.bcryptCost} (change with $BCRYPT_COST or config.bcryptCost)`);
configLogger.debug(`Log level is ${configLogger.level} (change with $LOG_LEVEL or config.logLevel)`);

// Export the configuration
module.exports = config;

/**
 * Creates a named log4js logger with trace/debug/info/warn/error/fatal methods
 * you can use to log messages concerning a specific component.
 *
 * @param {string} name - The name of the logger.
 * @returns {Logger} A log4js logger.
 */
function createLogger(name) {

  const logger = log4js.getLogger(name);
  if (config.logLevel) {
    logger.level = config.logLevel.toUpperCase();
  }

  return logger;
}

// Returns a path formed by appending the specified segments to the project's
// root directory.
//
//     config.path('foo', 'bar'); // => "/path/to/project/foo/bar"
/**
 * Returns a path formed by appending the specified segments to the project's root directory.
 *
 * @example
 * config.path('foo', 'bar'); // => "/path/to/project/foo/bar"
 *
 * @param {...string} segments - The segment paths.
 * @returns {string} The full path.
 */
function joinProjectPath(...segments) {
  return path.join(...[ root ].concat(segments));
}

/**
 * Parses a string value as a boolean.
 *
 * * Returns the specified default value if the value is undefined.
 * * To be considered `true`, a boolean string must be "1", "y", "yes", "t" or
 *   "true" (case insensitive).
 * * If the value is not a boolean, it will be considered `true` if "truthy".
 *
 * @param {*} value - The value to parse.
 * @param {boolean} defaultValue - The default value to return if the specified value is undefined.
 * @returns {boolean} A boolean value.
 */
function parseConfigBoolean(value, defaultValue) {
  if (value === undefined) {
    return defaultValue;
  } else if (!_.isString(value)) {
    return Boolean(value);
  } else {
    return Boolean(value.match(/^(1|y|yes|t|true)$/i));
  }
}

/**
 * Parses a string value as an integer.
 *
 * * Returns the specified default value if the value is undefined.
 *
 * @param {*} value - The value to parse.
 * @param {number} defaultValue - The default value to return if the specified value is undefined.
 * @returns {number} An integer value.
 */
function parseConfigInt(value, defaultValue) {
  if (value === undefined) {
    return defaultValue;
  }

  const parsed = parseInt(value, 10);
  if (_.isNaN(parsed)) {
    throw new Error(`${value} is not a valid integer`);
  }

  return parsed;
}

/**
 * Constructs a PostgreSQL database URL from several environment variables:
 *
 * * `$DATABASE_HOST` - The host to connect to (defaults to `localhost`)
 * * `$DATABASE_PORT` - The port to connect to on the host (none by default, will use PostgreSQL's default 5432 port)
 * * `$DATABASE_NAME` - The name of the database to connect to (defaults to `biopocket`)
 * * `$DATABASE_USERNAME` - The name of the PostgreSQL user to connect as (none by default)
 * * `$DATABASE_PASSWORD` - The password to authenticate with (none by default)
 *
 * Returns undefined if none of the variables are set.
 *
 * @example
 * buildDatabaseUrl(); // => undefined
 *
 * process.env.DATABASE_NAME = 'biopocket'
 * buildDatabaseUrl(); // => "postgres://localhost/biopocket"
 *
 * process.env.DATABASE_HOST = 'db.example.com'
 * process.env.DATABASE_PORT = '1337'
 * process.env.DATABASE_NAME = 'thebiopocketdb'
 * process.env.DATABASE_USERNAME = 'jdoe'
 * process.env.DATABASE_PASSWORD = 'changeme'
 * buildDatabaseUrl(); // => "postgres://jdoe:changeme@db.example.com:1337/thebiopocketdb"
 *
 * @returns {string} A PostgreSQL database URL.
 */
function buildDatabaseUrl() {

  const host = get('DATABASE_HOST');
  const port = get('DATABASE_PORT');
  const name = get('DATABASE_NAME');
  const username = get('DATABASE_USERNAME');
  const password = get('DATABASE_PASSWORD');
  if (host === undefined && port === undefined && name === undefined && username === undefined && password === undefined) {
    return undefined;
  }

  let url = 'postgres://';

  // Add credentials (if any)
  if (username) {
    url += username;

    if (password) {
      url += `:${password}`;
    }

    url += '@';
  }

  // Add host and port
  url += `${host || 'localhost'}`;
  if (port) {
    url += `:${port}`;
  }

  // Add database name
  url += `/${name || 'biopocket'}`;

  return url;
}

/**
 * Returns a variable from the environment.
 *
 * Given `"FOO"`, this function will look first in the `$FOO` environment
 * variable and returns its value if found. Otherwise, it will look for the
 * `$FOO_FILE` environment variable and, if found, will attempt to read the
 * contents of the file pointed to by its value. Otherwise it will return
 * undefined.
 *
 * @param {string} varName - The name of the environment variable to retrieve.
 * @returns {string|undefined} The value of the environment value (if set).
 */
function get(varName) {
  if (_.has(process.env, varName)) {
    return process.env[varName];
  }

  const fileVarName = `${varName}_FILE`;
  if (!_.has(process.env, fileVarName)) {
    return undefined;
  }

  return fs.readFileSync(process.env[fileVarName], 'utf8').trim();
}

/**
 * Ensures all properties of the configuration are valid.
 *
 * @param {Object} conf - The configuration object to validate.
 */
function validate(conf) {
  if (!_.isInteger(conf.bcryptCost) || conf.bcryptCost < 1) {
    throw new Error(`Unsupported bcrypt cost "${conf.bcryptCost}" (type ${typeof conf.bcryptCost}); must be an integer greater than or equal to 1`);
  } else if (!_.isBoolean(conf.cors)) {
    throw new Error(`Unsupported CORS value "${conf.cors}" (type ${typeof conf.cors}); must be a boolean`);
  } else if (!_.isString(conf.db) || !conf.db.match(/^postgres:\/\//)) {
    throw new Error(`Unsupported database URL "${conf.db}" (type ${typeof conf.db}); must be a string starting with "postgres://"`);
  } else if (!_.isInteger(conf.defaultPaginationLimit)) {
    throw new Error(`Unsupported default pagination limit value "${conf.defaultPaginationLimit}" (type ${typeof conf.defaultPaginationLimit}); must be an integer greater than or equal to 1`);
  } else if (!_.includes(SUPPORTED_ENVIRONMENTS, conf.env)) {
    throw new Error(`Unsupported environment "${JSON.stringify(conf.env)}"; must be one of: ${SUPPORTED_ENVIRONMENTS.join(', ')}`);
  } else if (!_.isString(conf.logLevel) || !_.includes(SUPPORTED_LOG_LEVELS, conf.logLevel.toUpperCase())) {
    throw new Error(`Unsupported log level "${conf.logLevel}" (type ${typeof conf.logLevel}); must be one of: ${SUPPORTED_LOG_LEVELS.join(', ')}`);
  } else if (!_.isInteger(conf.port) || conf.port < 1 || conf.port > 65535) {
    throw new Error(`Unsupported port number "${conf.port}" (type ${typeof conf.port}); must be an integer between 1 and 65535`);
  } else if (!_.isString(conf.sessionSecret) || conf.sessionSecret === 'changeme') {
    throw new Error(`Unsupported session secret "${conf.sessionSecret}" (type ${typeof conf.sessionSecret}); must be a string different than "changeme"`);
  }
}
