/**
 * @module scripts/sync-interface-data
 */
const knex = require('knex');
const { includes, map, pick } = require('lodash');
const { parse: parseUrl } = require('url');

const config = require('../config');
const { logQueries } = require('../utils/knex');
const Script = require('./script');

if (!config.interfaceDb) {
  throw new Error('An interface database URL is required to run this script; set one with $INTERFACE_DATABASE_URL or "interfaceDb" in config/local.js');
}

/**
 * Script to synchronize the data from the data collection interface to this project's database.
 *
 * In this script's documentation, the database of the data collection interface
 * is referred to as the "source database", while this project's database is
 * referred to as the "target database".
 *
 * This script is only capable of synchronizing new and modified records at this
 * time.  If records that have already been synchronized are deleted in the
 * source database, this script will ignore them and log a warning.
 *
 * The following table describes what theme data is synchronized (source columns
 * which have no corresponding target columns are not synchronized yet):
 *
 * | Source theme column | Target theme column | Note                                                                                                      |
 * | :---                | :---                | :---                                                                                                      |
 * | -                   | `id`                | This project's database ID is incrementally generated and unrelated to any data from the source database. |
 * | `id`                | `origin_id`         | The origin ID is used to reconcile the two databases' data.                                               |
 * | -                   | `api_id`            | This project's API ID is randomly generated and unrelated to any data from the source database.           |
 * | `code`              | `code`              |                                                                                                           |
 * | `title`             | `title`             |                                                                                                           |
 * | `description`       | `description`       |                                                                                                           |
 * | `short_description` | -                   |                                                                                                           |
 * | -                   | `source`            | Data no longer available in the source database.                                                          |
 * | `created_at`        | `created_at`        |                                                                                                           |
 * | `updated_at`        | `updated_at`        |                                                                                                           |
 *
 * The following table describes what action data is synchronized (source
 * columns which have no corresponding target columns are not synchronized yet):
 *
 * | Source action column     | Target action column | Note                                                                                                      |
 * | :---                     | :---                 | :---                                                                                                      |
 * | -                        | `id`                 | This project's database ID is incrementally generated and unrelated to any data from the source database. |
 * | `id`                     | `origin_id`          | The origin ID is used to reconcile the two databases' data.                                               |
 * | -                        | `api_id`             | This project's API ID is randomly generated and unrelated to any data from the source database.           |
 * | `code`                   | `code`               |                                                                                                           |
 * | `title`                  | `title`              |                                                                                                           |
 * | `description`            | -                    |                                                                                                           |
 * | `short_description`      | `description`        |                                                                                                           |
 * | `theme_id`               | `theme_id`           |                                                                                                           |
 * | `type_id`                | -                    |                                                                                                           |
 * | `impact`                 | `impact`             |                                                                                                           |
 * | `investment`             | -                    |                                                                                                           |
 * | `spot`                   | -                    |                                                                                                           |
 * | `cost_min`               | -                    |                                                                                                           |
 * | `time_min`               | -                    |                                                                                                           |
 * | `time_description`       | -                    |                                                                                                           |
 * | `surface_min`            | -                    |                                                                                                           |
 * | `importance`             | -                    |                                                                                                           |
 * | `unit_id`                | -                    |                                                                                                           |
 * | `complement_title`       | -                    |                                                                                                           |
 * | `complement_description` | -                    |                                                                                                           |
 * | `created_at`             | `created_at`         |                                                                                                           |
 * | `updated_at`             | `updated_at`         |                                                                                                           |
 *
 * @class
 * @memberof module:scripts
 */
class SyncInterfaceDataScript extends Script {

  /**
   * Runs the script.
   */
  async run() {

    // Fetch all data from the source and target database for comparison.
    const [ source, target ] = await Promise.all([
      this.loadSourceData(),
      this.loadTargetData()
    ]);

    // Create or update rows in the target database, based on the source database.
    await this.db.knex.transaction(trx => this.synchronize(trx, { source, target }));
  }

  /**
   * Synchronizes all data in the target database from the source database.
   *
   * @param {Transaction} trx - Knex transaction.
   * @param {Object} data - Data from the source and target database.
   * @param {Object} data.source - Data from the source database (see `loadSourceData`).
   * @param {Object} data.target - Data from the target database (see `loadTargetData`).
   */
  async synchronize(trx, data) {
    await this.synchronizeThemes(trx, data);
    await this.synchronizeActions(trx, data);
  }

  /**
   * Synchronizes actions in the target database from the source database.
   *
   * @param {Transaction} trx - Knex transaction.
   * @param {Object} data - Data from the source and target database.
   * @param {Object} data.source - Data from the source database (see `loadSourceData`).
   * @param {Object} data.target - Data from the target database (see `loadTargetData`).
   * @param {Object} data.themeIdMap - Map with source theme IDs as keys and the corresponding target theme IDs as values.
   */
  async synchronizeActions(trx, data) {

    const sourceActionIds = map(data.source.actions, 'id');
    const targetActionOriginIds = map(data.target.actions, 'origin_id');

    const actionsToCreate = data.source.actions.filter(action => !includes(targetActionOriginIds, action.id));
    const actionsToUpdate = data.target.actions.filter(action => includes(sourceActionIds, action.origin_id));
    const actionsToDestroy = data.target.actions.filter(action => !includes(sourceActionIds, action.origin_id));

    this.logger.info(`${actionsToCreate.length} actions to create`);
    this.logger.info(`${actionsToUpdate.length} actions to update`);

    if (actionsToDestroy.length) {
      this.logger.warn(`${actionsToDestroy.length} actions to destroy (not yet implemented)`);
    } else {
      this.logger.info(`${actionsToDestroy.length} actions to destroy`);
    }

    // Perform all insertions and updates.
    await Promise.all([
      ...actionsToCreate.map(actionData => createRecord(trx, 'actions', buildActionTargetData, actionData, data.themeIdMap)),
      ...actionsToUpdate.map(async actionData => {
        const sourceAction = data.source.actions.find(action => action.id === actionData.origin_id);
        await updateRecord(trx, 'actions', buildActionTargetData, sourceAction, data.themeIdMap);
      })
    ]);
  }

  /**
   * Synchronizes themes in the target database from the source database.
   *
   * A `themeIdMap` property will be added to the `data` argument.
   * This will be an object with source theme IDs as keys and the corresponding target theme IDs as values.
   *
   * @param {Transaction} trx - Knex transaction.
   * @param {Object} data - Data from the source and target database.
   * @param {Object} data.source - Data from the source database (see `loadSourceData`).
   * @param {Object} data.target - Data from the target database (see `loadTargetData`).
   */
  async synchronizeThemes(trx, data) {

    const sourceThemeIds = map(data.source.themes, 'id');
    const targetThemeOriginIds = map(data.target.themes, 'origin_id');

    const themesToCreate = data.source.themes.filter(theme => !includes(targetThemeOriginIds, theme.id));
    const themesToUpdate = data.target.themes.filter(theme => includes(sourceThemeIds, theme.origin_id));
    const themesToDestroy = data.target.themes.filter(theme => !includes(sourceThemeIds, theme.origin_id));

    this.logger.info(`${themesToCreate.length} themes to create`);
    this.logger.info(`${themesToUpdate.length} themes to update`);

    if (themesToDestroy.length) {
      this.logger.warn(`${themesToDestroy.length} themes to destroy (not yet implemented)`);
    } else {
      this.logger.info(`${themesToDestroy.length} themes to destroy`);
    }

    // Perform all insertions and updates.
    const result = await Promise.all([
      ...themesToCreate.map(themeData => createRecord(trx, 'themes', buildThemeTargetData, themeData)),
      ...themesToUpdate.map(async themeData => {
        const sourceTheme = data.source.themes.find(theme => theme.id === themeData.origin_id);
        await updateRecord(trx, 'themes', buildThemeTargetData, sourceTheme);
      })
    ]);

    const createdThemeIds = result.slice(0, themesToCreate.length);

    // Build a theme ID map with source theme IDs as keys and the corresponding target theme IDs as values.
    data.themeIdMap = {
      ...themesToCreate.reduce((memo, sourceTheme, i) => ({ ...memo, [sourceTheme.id]: createdThemeIds[i] }), {}),
      ...themesToUpdate.reduce((memo, targetTheme) => ({ ...memo, [targetTheme.origin_id]: targetTheme.id }), {})
    };
  }

  /**
   * Loads all data to synchronize from the source database.
   *
   * @returns {SyncSourceData} The data to synchronize.
   */
  async loadSourceData() {

    const [ actions, themes ] = await this.interfaceDb.transaction(trx => Promise.all([
      trx.select('*').from('actions'),
      trx.select('*').from('themes')
    ]));

    this.logger.info(`${actions.length} actions retrieved from interface database`);
    this.logger.info(`${themes.length} themes retrieved from interface database`);

    return { actions, themes };
  }

  /**
   * Loads data from the target database for comparison with the source database.
   *
   * @returns {SyncTargetData} The data to synchronize.
   */
  async loadTargetData() {

    const [ actions, themes ] = await this.db.knex.transaction(trx => Promise.all([
      trx.select('*').from('actions'),
      trx.select('*').from('themes')
    ]));

    this.logger.info(`${actions.length} actions retrieved from local database`);
    this.logger.info(`${themes.length} themes retrieved from local database`);

    return { actions, themes };
  }

  /**
   * Connects to both the source and target database before running the script.
   *
   * @override
   */
  async setUp() {

    this.interfaceDb = this.createInterfaceDatabase();

    await Promise.all([
      super.setUp(),
      this.checkInterfaceDatabaseConnection()
    ]);

    this.logger.info(`Connected to source database ${describeDbUrl(parseUrl(config.interfaceDb))}`);
    this.logger.info(`Connected to target database ${describeDbUrl(parseUrl(config.db))}`);
  }

  /**
   * Closes all database connections after running the script.
   *
   * @override
   */
  async tearDown() {
    await Promise.all([
      super.tearDown(),
      this.interfaceDb.destroy()
    ]);
  }

  /**
   * Makes sure that the connection to the data collection interface's database is working.
   */
  async checkInterfaceDatabaseConnection() {
    const result = await this.interfaceDb.raw('select 1+2 as n');
    if (result.rowCount !== 1 || result.rows[0].n !== 3) {
      throw new Error('Could not get expected result from the database');
    }
  }

  /**
   * Creates a Knex instance to connect to the data collection interface's database.
   *
   * @returns {Knex} A Knex instance which can be used to run queries.
   */
  createInterfaceDatabase() {

    const interfaceDb = knex({
      client: 'postgresql',
      connection: config.interfaceDb
    });

    const interfaceDbLogger = config.logger('interface:db');

    logQueries(interfaceDb, interfaceDbLogger);

    return interfaceDb;
  }
}

const script = new SyncInterfaceDataScript();
script.autoRun();

module.exports = script;

/**
 * Inserts a row in the target database, based on transforming data from the source database.
 *
 * The provided source data must include an `id` property,
 * which will be stored in the `origin_id` column of the target table for future synchronization.
 *
 * @param {Transaction} trx - Knex transaction.
 * @param {string} table - The name of the table to insert the row into.
 * @param {Function} targetDataFactory - Factory which, when called with this function's remaining arguments,
 *                                       will produce the row to insert into the target table.
 * @param {Object} sourceData - The data from the source database.
 * @param {...*} args - Additional arguments to pass to the target data factory function.
 * @returns {string} The ID of the inserted row.
 */
async function createRecord(trx, table, targetDataFactory, sourceData, ...args) {
  if (!sourceData.id) {
    throw new Error(`Source data must have an ID: ${JSON.stringify(sourceData)}`);
  }

  const rows = await trx.insert({
    origin_id: sourceData.id,
    ...targetDataFactory(sourceData, ...args)
  }).into(table).returning('id');

  return rows[0];
}

/**
 * Updates a row in the target database, based on transforming data from the source database.
 *
 * The provided source data must include an `id` property.
 * The updated row in the target table will be the one with a matching `origin_id` column.
 *
 * @param {Transction} trx - Knex transaction.
 * @param {string} table - The name of the table in which to update a row.
 * @param {Function} targetDataFactory - Factory which, when called with this function's remaining arguments,
 *                                       will produce the desired state of the row in the target table.
 * @param {Object} sourceData - The data from the source database.
 * @param {...*} args - Additional arguments to pass to the target data factory function.
 */
async function updateRecord(trx, table, targetDataFactory, sourceData, ...args) {
  if (!sourceData.id) {
    throw new Error(`Source data must have an ID: ${JSON.stringify(sourceData)}`);
  }

  await trx.update({
    ...targetDataFactory(sourceData, ...args)
  }).into(table).where('origin_id', sourceData.id);
}

/**
 * Returns an action row to insert into the target database (without identifiers), based on an action row from the source database.
 *
 * Note that the row is only built and returned; it is not inserted.
 *
 * @param {Object} sourceData - The action in the source database.
 * @param {Object} themeIdMap - Map with source theme IDs as keys and the corresponding target theme IDs as values.
 * @returns {Object} The desired state of the action in the target database.
 */
function buildActionTargetData(sourceData, themeIdMap) {
  return {
    ...pick(sourceData, 'code', 'title', 'impact', 'created_at', 'updated_at'),
    description: sourceData.short_description,
    theme_id: themeIdMap[sourceData.theme_id]
  };
}

/**
 * Returns a theme row to insert into the target database (without identifiers), based on a theme row from the source database.
 *
 * Note that the row is only built and returned; it is not inserted.
 *
 * @param {Object} sourceData - The theme in the source database.
 * @returns {Object} The desired state of the theme in the target database.
 */
function buildThemeTargetData(sourceData) {
  return {
    ...pick(sourceData, 'code', 'title', 'description', 'created_at', 'updated_at'),
    source: sourceData.source || null
  };
}

/**
 * Returns a representation of the specified PostgreSQL connection URL for logging.
 *
 * The userinfo component of the URL (username and password) is not included.
 *
 * @param {string} url - A full PostgreSQL connection URL.
 * @returns {string} A simplified connection URL to display.
 */
function describeDbUrl(url) {
  return `${url.hostname}:${url.port || '5432'}${url.pathname}`;
}

/**
 * @typedef {Object} SyncSourceData
 * @property {Object} actions - Action database rows.
 * @property {Object} themes - Theme database rows.
 */

/**
 * @typedef {Object} SyncTargetData
 * @property {Object} actions - Action database rows.
 * @property {Object} themes - Theme database rows.
 */
