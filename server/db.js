const _ = require('lodash');
const bookshelf = require('bookshelf');
const bookshelfGeojson = require('bookshelf-geojson');
const bookshelfTouch = require('bookshelf-touch');
const knex = require('knex');
const knexPostgis = require('knex-postgis');

const config = require('../config');
const bookshelfReturning = require('./utils/bookshelf-returning');

const logger = config.logger('db');

/**
 * Application database automatically configured from `config/index.js`.
 *
 * @property {Knex} knex - A Knex instance which can be used to run queries.
 * @property {Bookshelf} bookshelf - A Bookshelf instance which can be used to manage models.
 * @property {PostGIS} st - An instance of the [knex-postgis](https://github.com/jfgodoy/knex-postgis) extension,
 *   which has useful functions to work with PostGIS types when making queries, such as `st.asGeoJSON(column)`.
 * @see http://knexjs.org
 * @see http://bookshelfjs.org
 */
class Database {
  constructor() {
    this.isOpen = false;

    this.knex = setUpKnex();

    this.bookshelf = bookshelf(this.knex);
    this.bookshelf.plugin('registry');
    this.bookshelf.plugin('virtuals');
    this.bookshelf.plugin(bookshelfGeojson(this.knex));
    this.bookshelf.plugin(bookshelfTouch);
    this.bookshelf.plugin(bookshelfReturning);

    this.st = knexPostgis(this.knex);
  }

  /**
   * Ensures that a database connection is open.
   *
   * @instance
   * @memberof Database
   * @returns {Promise} A promise that will be resolved if a database connection was successfully established.
   */
  open() {
    return this.knex.raw('select 1+2 as n').then(function(result) {
      if (result.rowCount !== 1 || result.rows[0].n !== 3) {
        throw new Error('Could not get expected result from the database');
      }
    });
  }

  /**
   * Closes the database connection pool.
   *
   * @instance
   * @memberof Database
   */
  close() {
    if (!this.knex) {
      return;
    }

    const onClosed = () => {
      this.knex = undefined;
      this.bookshelf = undefined;
      this.st = undefined;
      this.isOpen = false;
    };

    this.knex.destroy().then(onClosed, onClosed);
  }
}

function setUpKnex() {

  const instance = knex({
    client: 'postgresql',
    connection: config.db
  });

  // Log queries in development & test environments.
  if (config.env == 'development' || config.env == 'test') {
    instance.on('query-response', (res, obj, builder) => logger.trace(builder.toString()));
  }

  return instance;
}

module.exports = new Database();
