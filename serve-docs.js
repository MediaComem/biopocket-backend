const _ = require('lodash');
const liveServer = require('live-server');

const config = require('./config');

const liveServerConfig = {
  browser: config.docs.browser,
  file: 'index.html',
  host: config.docs.host,
  open: config.docs.open,
  port: config.docs.port,
  root: './docs/src',
  wait: 50
};

liveServer.start(liveServerConfig);
