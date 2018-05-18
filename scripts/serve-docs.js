const getPort = require('get-port');
const liveServer = require('live-server');

const config = require('../config');

const logger = config.logger('scripts:serve-docs');

/**
 * Serves the documentation directory in the browser with live reload.
 *
 * A free random port is found by default, unless a specific port has been
 * configured.
 */
Promise
  .resolve()
  .then(getDocsPort)
  .then(serveDocs)
  .catch(err => logger.fatal(err));

/**
 * Returns the port configured to serve the documentation directory, or a free
 * random port.
 *
 * @returns {Promise<number>} A promise that will be resolved with a free port
 *   number (or rejected if no free port can be found).
 */
function getDocsPort() {
  return config.docs.port ? Promise.resolve(config.docs.port) : getPort();
}

/**
 * Serves the documentation directory in the browser on the specified port using
 * live-server.
 *
 * The following configuration can also be customized:
 *
 * * The `config.docs.host` property determines the host to serve the
 *   documentation on (`localhost` by default).
 * * The `config.docs.open` property determines whether to automatically open
 *   the browser or not (true by default).
 *
 * @param {number} port - The port to run live-server on.
 */
function serveDocs(port) {

  const liveServerConfig = {
    browser: config.docs.browser,
    file: 'index.html',
    host: config.docs.host,
    open: config.docs.open,
    port: port,
    root: config.path('docs'),
    wait: 50
  };

  liveServer.start(liveServerConfig);
}
