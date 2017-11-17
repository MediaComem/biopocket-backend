const Script = require('./script');

class SampleDataScript extends Script {
  run() {

    this.start = new Date().getTime();

    process.env.ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@example.com';
    process.env.ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'test';
    process.env.NO_SCRIPT = true;

    return require('./create-admin').run();
  }

  onSuccess() {
    const duration = (new Date().getTime() - this.start) / 1000;
    this.logger.info(`Sample data generated in ${duration}s`);
  }
}

const script = new SampleDataScript();
script.autoRun();

module.exports = script;
