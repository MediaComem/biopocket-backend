const _ = require('lodash');
const bookshelf = require('bookshelf');
const bookshelfTouch = require('bookshelf-touch');
const knex = require('knex');

const config = require('../config');
const { logger: knexLogger } = require('./utils/knex');

/**
 * Application database.
 *
 * @property {Knex} knex - A Knex instance which can be used to run queries.
 * @property {Bookshelf} bookshelf - A Bookshelf instance which can be used to manage models.
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
    this.bookshelf.plugin(bookshelfTouch);
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
    instance.on('query', knexLogger);
  }

  return instance;
}

module.exports = new Database();
