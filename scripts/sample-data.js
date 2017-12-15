const Location = require('../server/models/location');
const locationFixtures = require('../server/spec/fixtures/location');
const Script = require('./script');

const LOCATIONS_COUNT = 50;

const ONEX_BBOX = {
  southWest: [ 6.086417, 46.173987 ],
  northEast: [ 6.112753, 46.196898 ]
};

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

    // Create an admin user.
    process.env.ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@example.com';
    process.env.ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'test';
    process.env.NO_SCRIPT = true;
    await require('./create-admin').run();

    // Make sure there are at least 50 locations in the database.
    // If not, generate new random locations in Onex until there are 50 in total.
    const locationsCount = await new Location().resetQuery().count();
    if (locationsCount < LOCATIONS_COUNT) {
      await Promise.all(new Array(LOCATIONS_COUNT - locationsCount).fill(0).map(() => locationFixtures.location({
        bbox: ONEX_BBOX
      })));
    } else {
      this.logger.debug(`There are already ${LOCATIONS_COUNT} locations or more in the database`);
    }
  }

  onSuccess() {
    const duration = (new Date().getTime() - this.start) / 1000;
    this.logger.info(`Sample data generated in ${duration}s`);
  }
}

const script = new SampleDataScript();
script.autoRun();

module.exports = script;
