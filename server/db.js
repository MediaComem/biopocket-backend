const _ = require('lodash');
const bookshelf = require('bookshelf');
const bookshelfTouch = require('bookshelf-touch');
const knex = require('knex');

const config = require('../config');
const knexLogger = require('./utils/knex-logger');

class Database {
  constructor() {
    this.isOpen = false;

    this.knex = setUpKnex();

    this.bookshelf = bookshelf(this.knex);
    this.bookshelf.plugin('registry');
    this.bookshelf.plugin('virtuals');
    this.bookshelf.plugin(bookshelfTouch);
  }

  open() {
    return this.ensureConnected();
  }

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

  ensureConnected() {
    return this.knex.raw('select 1+2 as n').then(function(result) {
      if (result.rowCount !== 1 || result.rows[0].n !== 3) {
        throw new Error('Could not get expected result from the database');
      }
    });
  }
}

function setUpKnex() {

  const instance = knex({
    client: 'postgresql',
    connection: config.db
  });

  if (config.env == 'development' || config.env == 'test') {
    instance.on('query', knexLogger);
  }

  return instance;
}

module.exports = new Database();
