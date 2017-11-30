const bodyParser = require('body-parser');
const cors = require('cors');
const express = require('express');
const path = require('path');

const config = require('../config');
const api = require('./api');
const db = require('./db');
const { logger: expressLogger } = require('./utils/express');

const logger = config.logger('app');

const app = express();

app.set('db', db);
app.set('env', config.env);

app.use(expressLogger);
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

logger.debug(`CORS is ${config.cors ? 'enabled' : 'disabled'} (change with $CORS or config.cors)`);
if (config.cors) {
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
