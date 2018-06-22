const bodyParser = require('body-parser');
const express = require('express');

const config = require('../config');
const api = require('./api');
const db = require('./db');
const emails = require('./emails');
const cors = require('./utils/cors');
const { logger: expressLogger } = require('./utils/express');

const logger = config.logger('app');

const app = express();

/**
 * Performs the various asynchronous operations required to initialize the
 * application.
 *
 * @returns {Promise} A promise that will be resolved when the app has been
 *                    fully initialized and is ready to process requests.
 */
app.init = function() {
  return Promise.all([
    // Open a connection to the database.
    db.open(),
    // Load & compile email templates.
    emails.init()
  ]);
};

app.set('env', config.env);

app.use(expressLogger);
app.use(bodyParser.json());

logger.debug(`CORS is ${config.cors.enabled ? 'enabled' : 'disabled'} (change with $CORS or config.cors.enabled)`);
if (config.cors.enabled) {
  app.use(cors());
}

app.use('/api', api);
app.use('/', (req, res) => res.send('biopocket'));

// Catch 404 and forward to error handler.
app.use((req, res, next) => {
  const err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// Error handler
app.use((err, req, res, next) => {
  res.status(err.status || 500).send(`Error: ${err.message}`);
});

module.exports = app;
