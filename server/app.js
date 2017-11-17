const cors = require('cors');
const debug = require('debug')('biopocket:app');
const express = require('express');
const path = require('path');
const logger = require('morgan');
const bodyParser = require('body-parser');

const config = require('../config');

const app = express();

app.set('env', config.env);

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

debug(`CORS is ${config.cors ? 'enabled' : 'disabled'} (set $CORS or config.cors to enable)`);
if (config.cors) {
  app.use(cors());
}

app.use('/', (req, res) => res.send('biopocket'));

// catch 404 and forward to error handler
app.use((req, res, next) => {
  const err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use((err, req, res, next) => {
  res.status(err.status || 500).send(`Error: ${err.message}`);
});

module.exports = app;
