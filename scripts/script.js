const config = require('../config');

class Script {
  constructor(script) {
    this.script = script;
    this.logger = config.logger('script');
  }

  autoRun() {
    if (!process.env.NO_SCRIPT) {
      return Promise
        .resolve()
        .then(() => this.db.open())
        .then(() => this.run())
        .then(() => this.onSuccess())
        .catch(err => this.onFailure(err))
        .then(() => this.db.close(), () => this.db.close())
        .then(() => this.exit());
    }
  }

  run() {
    if (this.script) {
      return this.script();
    }
  }

  onFailure(err) {
    this.logger.fatal(err);
    this.exitCode = 1;
  }

  onSuccess() {
    this.logger.info(`${this.constructor.name} successful`);
  }

  exit() {
    process.exit(this.exitCode || 0);
  }

  get db() {
    return require('../server/db');
  }
}

module.exports = Script;
