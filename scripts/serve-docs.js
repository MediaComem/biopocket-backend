const _ = require('lodash');
const getPort = require('get-port');
const liveServer = require('live-server');

const config = require('../config');

Promise
  .resolve()
  .then(getDocsPort)
  .then(serveDocs);

function getDocsPort() {
  return config.docs.port ? Promise.resolve(config.docs.port) : getPort();
}

function serveDocs(port) {

  const liveServerConfig = {
    browser: config.docs.browser,
    file: 'index.html',
    host: config.docs.host,
    open: config.docs.open,
    port: port,
    root: './docs',
    wait: 50
  };

  liveServer.start(liveServerConfig);
}
