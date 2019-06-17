const { sample } = require('lodash');

const Action = require('../server/models/action');
const Location = require('../server/models/location');
const Theme = require('../server/models/theme');
const actionFixtures = require('../server/spec/fixtures/actions');
const locationFixtures = require('../server/spec/fixtures/location');
const themeFixtures = require('../server/spec/fixtures/theme');
const { create } = require('../utils/data');
const Script = require('./script');

const LOCATIONS_COUNT = 50;
const THEME_COUNT = 10;
const ACTIONS_COUNT = 100;

const ONEX_BBOX = {
  southWest: [ 6.086417, 46.173987 ],
  northEast: [ 6.112753, 46.196898 ]
};

/**
 * Script to generate sample data for development.
 *
 *     $> npm run sample-data
 *
 * @class
 */
class SampleDataScript extends Script {
  /**
   * Runs `CreateAdminScript` and creates a default admin user with the email `admin@example.com` and password `test`.
   * Additionally, generates sample data in the database to test the application.
   *
   * @method
   * @memberof SampleDataScript
   * @instance
   */
  async run() {

    this.start = new Date().getTime();

    // Create an admin user.
    process.env.ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@example.com';
    process.env.ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'test';
    process.env.NO_SCRIPT = true;
    await require('./create-admin').run();

    // Generate sample locations if needed
    await this.sampleLocations();
    // Generate sample themes if needed and retrieve them all
    const themes = await this.sampleThemes();
    // Generate sample actions if needed, grouped randomly by the themes
    await this.sampleActions(themes);

  }

  /**
   * Logs the time it took to generate the sample data.
   */
  onSuccess() {
    const duration = (new Date().getTime() - this.start) / 1000;
    this.logger.info(`Sample data generated in ${duration}s`);
  }

  /**
   * Makes sure there are at least 50 locations in the database.
   * If not, generates new random locations in Onex until there are 50 in total.
   *
   * Automatically called by the `run()` method.
   *
   * @method
   * @memberof SampleDataScript
   * @instance
   */
  async sampleLocations() {
    const locationsCount = await new Location().resetQuery().count();
    if (locationsCount < LOCATIONS_COUNT) {
      await create(LOCATIONS_COUNT - locationsCount, locationFixtures.location, { bbox: ONEX_BBOX });
    } else {
      this.logger.debug(`There are already ${LOCATIONS_COUNT} locations or more in the database`);
    }
  }

  /**
   * Makes sure there are at least 10 themes in the database.
   * If not, generates new random themes until there are 10 in total.
   * In any case, returns all the themes in the database.
   *
   * Automatically called by the `run()` method.
   *
   * @method
   * @memberof SampleDataScript
   * @instance
   * @returns {Collection<Theme>} A Bookshelf collection of themes
   */
  async sampleThemes() {
    const themesCount = await new Theme().resetQuery().count();
    if (themesCount < THEME_COUNT) {
      await create(THEME_COUNT - themesCount, themeFixtures.theme);
    } else {
      this.logger.debug(`There are already ${THEME_COUNT} themes or more in the database`);
    }

    return new Theme().resetQuery().fetchAll();
  }

  /**
   * Make sure there are at least 50 actions in the database.
   * If not, generate new random actions, using given themes if provided, until there are 50 in total.
   *
   * Automatically called by the `run()` method.
   *
   * @method
   * @memberof SampleDataScript
   * @instance
   * @param {Collection<Theme>} [themes] - A Bookshelf collection of themes
   */
  async sampleActions(themes) {
    const actionsCount = await new Action().resetQuery().count();
    if (actionsCount < ACTIONS_COUNT) {
      await create(ACTIONS_COUNT - actionsCount, () => actionFixtures.action({ theme: sample(themes.models) }));
    } else {
      this.logger.debug(`There are already ${ACTIONS_COUNT} actions or more in the database`);
    }
  }
}

const script = new SampleDataScript();
script.autoRun();

module.exports = script;
