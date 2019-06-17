/**
 * This file exports a configuration object that is used throughout the
 * application to customize behavior. That object is built from environment
 * variables, an optional configuration file, and from default values.
 *
 * @module config/index
 */
const fs = require('fs');
const _ = require('lodash');
const log4js = require('log4js');
const path = require('path');
const { parse: parseQueryString, stringify: stringifyQueryString } = require('query-string');
const { URL } = require('url');
const joinUrl = require('url-join');

const REQUIRED_MAIL_PROPERTIES = [ 'host', 'port', 'secure', 'username', 'password', 'fromAddress' ];
const SUPPORTED_ENVIRONMENTS = [ 'development', 'production', 'test' ];
const SUPPORTED_LOG_LEVELS = [ 'TRACE', 'DEBUG', 'INFO', 'WARN', 'ERROR', 'FATAL' ];

const env = process.env.NODE_ENV;
const pkg = require(path.join('..', 'package'));
const root = path.normalize(path.join(__dirname, '..'));

// Immutable configuration & utility functions
const fixedConfig = {
  buildUrl,
  logger: createLogger,
  root: root,
  version: pkg.version,
  path: joinProjectPath
};

// Configuration from environment variables
const configFromEnvironment = {
  baseUrl: getEnvVar('BASE_URL'),
  bcryptCost: parseConfigInt(getEnvVar('BCRYPT_COST')),

  cors: {
    enabled: parseConfigBoolean(getEnvVar('CORS')),
    origin: getEnvVar('CORS_ORIGIN')
  },

  db: getDatabaseUrl(),
  defaultPaginationLimit: parseConfigInt(getEnvVar('DEFAULT_PAGINATION_LIMIT')),

  docs: {
    browser: getEnvVar('DOCS_BROWSER'),
    host: getEnvVar('DOCS_HOST'),
    open: getEnvVar('DOCS_OPEN'),
    port: getEnvVar('DOCS_PORT')
  },

  env,

  imagesBaseUrl: getEnvVar('IMAGES_BASE_URL'),
  interfaceDb: getDatabaseUrl('INTERFACE_DATABASE_', 'biopocket_interface'),

  logLevel: getEnvVar('LOG_LEVEL'),

  mail: {
    enabled: parseConfigBoolean(getEnvVar('MAIL_ENABLED')),
    host: getEnvVar('MAIL_HOST'),
    port: parseConfigInt(getEnvVar('MAIL_PORT')),
    secure: parseConfigBoolean(getEnvVar('MAIL_SECURE')),
    username: getEnvVar('MAIL_USERNAME'),
    password: getEnvVar('MAIL_PASSWORD'),
    fromName: getEnvVar('MAIL_FROM_NAME'),
    fromAddress: getEnvVar('MAIL_FROM_ADDRESS')
  },

  port: parseConfigInt(getEnvVar('PORT')),
  registrationOtpLifespan: getEnvVar('REGISTRATION_OTP_LIFESPAN'),
  sessionSecret: getEnvVar('SESSION_SECRET')
};

// Configuration from a local file (`config/local.js` by default, or `$CONFIG`)
let configFromLocalFile = {};
const localConfigFile = path.resolve(root, getEnvVar('CONFIG') || path.join('config', 'local.js'));
if (localConfigFile !== joinProjectPath('config', 'local.js') && !fs.existsSync(localConfigFile)) {
  throw new Error(`No configuration file found at ${localConfigFile}`);
} else if (fs.existsSync(localConfigFile)) {
  const localConfig = require(localConfigFile);
  configFromLocalFile = _.pick(localConfig,
    'baseUrl', 'bcryptCost', 'cors.enabled', 'cors.origin', 'db', 'defaultPaginationLimit',
    'docs.browser', 'docs.host', 'docs.open', 'docs.port',
    'env', 'imagesBaseUrl', 'interfaceDb', 'logLevel',
    'mail.enabled', 'mail.fromName', 'mail.fromAddress', 'mail.host', 'mail.password', 'mail.port', 'mail.secure', 'mail.username',
    'port', 'registrationOtpLifespan', 'sessionSecret');
}

// Default configuration
const defaultConfig = {
  bcryptCost: 10,

  cors: {
    enabled: _.get(configFromEnvironment, 'cors.origin') !== undefined || _.get(configFromLocalFile, 'cors.origin') !== undefined
  },

  db: 'postgres://localhost/biopocket',
  defaultPaginationLimit: 100,

  docs: {
    host: '127.0.0.1',
    open: true,
    port: undefined
  },

  env: 'development',
  logLevel: 'INFO',

  mail: {
    enabled: env !== 'test',
    fromName: 'BioPocket',
    secure: false
  },

  port: 3000,

  registrationOtpLifespan: 2 * 60 * 60 * 1000 // 2 hours
};

defaultConfig.baseUrl = `http://localhost:${configFromEnvironment.port || configFromLocalFile.port || defaultConfig.port}`;

// Environment variables take precedence over the configuration file, and both
// take precedence over the default configuration.
const config = _.merge({}, defaultConfig, configFromLocalFile, configFromEnvironment, fixedConfig);

validate(config);

const configLogger = config.logger('config');
configLogger.debug(`Environment is ${config.env} (change with $NODE_ENV or config.env)`);
configLogger.debug(`Base URL is ${config.baseUrl} (change with $BASE_URL or config.baseUrl)`);
configLogger.debug(`bcrypt cost is ${config.bcryptCost} (change with $BCRYPT_COST or config.bcryptCost)`);
configLogger.debug(`Log level is ${configLogger.level} (change with $LOG_LEVEL or config.logLevel)`);

// Export the configuration
module.exports = config;

/**
 * Creates an URL from options (e.g. path, query string, etc).
 *
 * @param {Object} options - URL properties (see {@link https://developer.mozilla.org/en-US/docs/Web/API/URL}).
 * @param {string} [options.path] - Either an URL path to join with the application's base URL, or an absolute URL.
 * @param {Object} [options.query] - URL query parameters to add to the URL (they will be merged with any existing params in the `search` string).
 * @returns {string} A full URL.
 */
function buildUrl(options) {
  const url = new URL(config.baseUrl);

  _.extend(url, {
    pathname: joinUrl(url.pathname, options.path),
    search: stringifyQueryString(_.extend(parseQueryString(url.search), options.query)),
    ...options
  });

  return url.toString();
}

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

/**
 * Retrieves or constructs a PostgreSQL database URL from several environment variables.
 *
 * If the `$DATABASE_URL` variable is set, its value is returned. Otherwise,
 * the URL is constructed from the following variables:
 *
 * * `$DATABASE_HOST` - The host to connect to (defaults to `localhost`)
 * * `$DATABASE_PORT` - The port to connect to on the host (none by default, will use PostgreSQL's default 5432 port)
 * * `$DATABASE_NAME` - The name of the database to connect to (defaults to `biopocket`)
 * * `$DATABASE_USERNAME` - The name of the PostgreSQL user to connect as (none by default)
 * * `$DATABASE_PASSWORD` - The password to authenticate with (none by default)
 *
 * Returns undefined if none of the variables are set.
 *
 * The `DATABASE_` prefix can be changed by supplying a new prefix as an argument.
 * For example, calling this function with `DB_` will look for the `$DB_URL` variable,
 * and so on.
 *
 * @example
 * buildDatabaseUrl(); // => undefined
 *
 * process.env.DATABASE_URL = 'postgres://example.com/biopocket';
 * buildDatabaseUrl(); // => "postgres://example.com/biopocket"
 *
 * delete process.env.DATABASE_URL;
 * process.env.DATABASE_NAME = 'biopocket';
 * buildDatabaseUrl(); // => "postgres://localhost/biopocket"
 *
 * process.env.DATABASE_HOST = 'db.example.com';
 * process.env.DATABASE_PORT = '1337';
 * process.env.DATABASE_NAME = 'thebiopocketdb';
 * process.env.DATABASE_USERNAME = 'jdoe';
 * process.env.DATABASE_PASSWORD = 'changeme';
 * buildDatabaseUrl(); // => "postgres://jdoe:changeme@db.example.com:1337/thebiopocketdb"
 *
 * process.env.DB_URL = 'postgres://db/biopocket';
 * buildDatabaseUrl('DB_'); // => "postgres://db/biopocket"
 *
 * @param {string} prefix - The prefix of the environment variable names ("DATABASE_" by default).
 * @param {string} defaultName - The default name of the database (if not provided through `$DATABASE_NAME` or `$DATABASE_URL`).
 * @returns {string} A PostgreSQL database URL.
 */
function getDatabaseUrl(prefix = 'DATABASE_', defaultName = 'biopocket') {

  const fullUrl = getEnvVar(`${prefix}URL`);
  if (fullUrl) {
    return fullUrl;
  }

  const host = getEnvVar(`${prefix}HOST`);
  const port = getEnvVar(`${prefix}PORT`);
  const name = getEnvVar(`${prefix}NAME`);
  const username = getEnvVar(`${prefix}USERNAME`);
  const password = getEnvVar(`${prefix}PASSWORD`);
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
  url += `/${name || defaultName}`;

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
function getEnvVar(varName) {
  if (_.has(process.env, varName)) {
    return process.env[varName];
  }

  const fileVarName = `${varName}_FILE`;
  if (!_.has(process.env, fileVarName)) {
    return undefined;
  }

  return fs.readFileSync(process.env[fileVarName], 'utf8').trim();
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

/* eslint-disable complexity */
// Note: these validation functions naturally have high cyclomatic complexity
// due to the high number of conditionals (https://eslint.org/docs/rules/complexity).

/**
 * Ensures all properties of the configuration are valid.
 *
 * @param {Object} conf - The configuration object to validate.
 */
function validate(conf) {
  if (!_.isString(conf.baseUrl)) {
    throw new Error(`Unsupported base URL "${conf.baseUrl}" (type ${typeof conf.baseUrl}); must be a string`);
  } else if (!conf.baseUrl.match(/^https?:\/\//)) {
    throw new Error(`Unsupported base URL "${conf.baseUrl}; must start with http:// or https://"`);
  } else if (!_.isInteger(conf.bcryptCost) || conf.bcryptCost < 1) {
    throw new Error(`Unsupported bcrypt cost "${conf.bcryptCost}" (type ${typeof conf.bcryptCost}); must be an integer greater than or equal to 1`);
  } else if (!_.isPlainObject(conf.cors)) {
    throw new Error(`Unsupported CORS value "${conf.cors}" (type ${typeof conf.cors}); must be an object`);
  } else if (!_.isBoolean(conf.cors.enabled)) {
    throw new Error(`Unsupported CORS enabled value "${conf.cors.enabled}" (type ${typeof conf.cors.enabled}); must be a boolean`);
  } else if (config.cors.origin !== undefined && !_.isString(conf.cors.origin)) {
    throw new Error(`Unsupported CORS origin value "${conf.cors.origin}" (type ${typeof conf.cors.origin}); must be a string`);
  } else if (!_.isString(conf.db) || !conf.db.match(/^postgres:\/\//)) {
    throw new Error(`Unsupported database URL "${conf.db}" (type ${typeof conf.db}); must be a string starting with "postgres://"`);
  } else if (!_.isInteger(conf.defaultPaginationLimit) || conf.defaultPaginationLimit < 1) {
    throw new Error(`Unsupported default pagination limit value "${conf.defaultPaginationLimit}" (type ${typeof conf.defaultPaginationLimit}); must be an integer greater than or equal to 1`);
  } else if (!_.includes(SUPPORTED_ENVIRONMENTS, conf.env)) {
    throw new Error(`Unsupported environment "${JSON.stringify(conf.env)}"; must be one of: ${SUPPORTED_ENVIRONMENTS.join(', ')}`);
  } else if (conf.interfaceDb !== undefined && (!_.isString(conf.interfaceDb) || !conf.interfaceDb.match(/^postgres:\/\//))) {
    throw new Error(`Unsupported interface database URL "${conf.interfaceDb}" (type ${typeof conf.interfaceDb}); must be a string starting with "postgres://"`);
  } else if (!_.isString(conf.imagesBaseUrl) || !conf.imagesBaseUrl.match(/^https?:\/\//)) {
    throw new Error(`Unsupported images base URL "${conf.imagesBaseUrl}" (type ${typeof conf.imagesBaseUrl}); must be a string starting with "http://" or "https://"`);
  } else if (!_.isString(conf.logLevel) || !_.includes(SUPPORTED_LOG_LEVELS, conf.logLevel.toUpperCase())) {
    throw new Error(`Unsupported log level "${conf.logLevel}" (type ${typeof conf.logLevel}); must be one of: ${SUPPORTED_LOG_LEVELS.join(', ')}`);
  } else if (!_.isInteger(conf.port) || conf.port < 1 || conf.port > 65535) {
    throw new Error(`Unsupported port number "${conf.port}" (type ${typeof conf.port}); must be an integer between 1 and 65535`);
  } else if (!_.isInteger(conf.registrationOtpLifespan) || conf.registrationOtpLifespan <= 0) {
    throw new Error(`Unsupported registration OTP lifespan "${conf.registrationOtpLifespan}"; must be a whole number of milliseconds greater than zero`);
  } else if (!_.isString(conf.sessionSecret) || conf.sessionSecret === 'changeme') {
    throw new Error(`Unsupported session secret "${conf.sessionSecret}" (type ${typeof conf.sessionSecret}); must be a string different than "changeme"`);
  }

  validateMail(conf.mail);
}

/**
 * Ensures all properties of the mail sub-configuration are valid.
 *
 * @param {Object} mail - The configuration object to validate.
 */
function validateMail(mail) {
  if (!_.isBoolean(mail.enabled)) {
    throw new Error(`Unsupported mail.enabled value "${mail.enabled}" (type ${typeof mail.enabled}); must be a boolean`);
  } else if (mail.host !== undefined && !_.isString(mail.host)) {
    throw new Error(`Unsupported mail.host value "${mail.host}" (type ${typeof mail.host}); must be a string`);
  } else if (mail.port !== undefined && (!_.isInteger(mail.port) || mail.port < 1 || mail.port > 65535)) {
    throw new Error(`Unsupported mail.port value "${mail.port}" (type ${typeof mail.port}); must be an integer between 1 and 65535`);
  } else if (mail.secure !== undefined && !_.isBoolean(mail.secure)) {
    throw new Error(`Unsupported mail.secure value "${mail.secure}" (type ${typeof mail.secure}); must be a boolean`);
  } else if (mail.username !== undefined && !_.isString(mail.username)) {
    throw new Error(`Unsupported mail.username value "${mail.username}" (type ${typeof mail.username}); must be a string`);
  } else if (mail.password !== undefined && !_.isString(mail.password)) {
    throw new Error(`Unsupported mail.password value "${mail.password}" (type ${typeof mail.password}); must be a string`);
  } else if (mail.fromName !== undefined && !_.isString(mail.fromName)) {
    throw new Error(`Unsupported mail.fromName value "${mail.fromName}" (type ${typeof mail.fromName}); must be a string`);
  } else if (mail.fromAddress !== undefined && !_.isString(mail.fromAddress)) {
    throw new Error(`Unsupported mail.fromAddress value "${mail.fromAddress}" (type ${typeof mail.fromAddress}); must be a string`);
  } else if (mail.fromAddress !== undefined && !mail.fromAddress.match(/^[^@]+@[^.]+\.[^.]+$/)) {
    throw new Error(`Unsupported mail.fromAddress value "${mail.fromAddress}"; must be a valid email address`);
  }

  if (mail.enabled) {
    for (const requiredMailProperty of REQUIRED_MAIL_PROPERTIES) {
      if (mail[requiredMailProperty] === undefined) {
        throw new Error(`Configuration property mail.${requiredMailProperty} is required when mail.enabled is true`);
      }
    }
  }
}

/* eslint-enable complexity */
