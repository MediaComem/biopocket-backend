const Script = require('./script');

/**
 * Script to generate sample data for development.
 *
 * For now, this script basically runs `CreateAdminScript` and creates a default
 * admin user with the e-mail `admin@example.com` and password `test`.
 *
 * Later on it might be augmented to generate useful data to test the
 * application.
 *
 *     $> npm run sample-data
 *
 * @class
 * @memberof module:scripts
 */
class SampleDataScript extends Script {
  async run() {

    this.start = new Date().getTime();

    process.env.ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@example.com';
    process.env.ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'test';
    process.env.NO_SCRIPT = true;

    await require('./create-admin').run();
  }

  onSuccess() {
    const duration = (new Date().getTime() - this.start) / 1000;
    this.logger.info(`Sample data generated in ${duration}s`);
  }
}

const script = new SampleDataScript();
script.autoRun();

module.exports = script;
