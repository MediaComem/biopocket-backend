const _ = require('lodash');
const enrichApiError = require('enrich-api-error');
const moment = require('moment');
const SuperRest = require('superrest');

const app = require('../app');
const chai = require('./chai');
const config = require('../../config');
const db = require('../db');

let databaseConnectionClosed = false;
const logger = config.logger('spec');

class EnrichedSuperRest extends SuperRest {
  expect(res, ...args) {
    try {
      return super.expect(res, ...args);
    } catch(err) {
      throw enrichApiError(err, res);
    }
  }
}

exports.initSuperRest = function(options) {
  return new EnrichedSuperRest(app, _.defaults({}, options, {
    pathPrefix: '/api',
    updateMethod: 'PATCH'
  }));
};

exports.expect = chai.expect;

exports.setUp = function() {
  after(() => {
    if (!databaseConnectionClosed) {
      db.close();
      databaseConnectionClosed = true;
    }
  });
};

exports.cleanDatabase = async function() {
  const start = new Date().getTime();

  // Sequences of tables to delete in order to avoid foreign key conflicts
  const tablesToDelete = [
    [ 'users' ]
  ];

  for (let tableList of tablesToDelete) {
    await Promise.all(tableList.map(table => db.knex.raw(`DELETE FROM ${table};`)));
  }

  const duration = (new Date().getTime() - start) / 1000;
  logger.debug(`Cleaned database in ${duration}s`);
}

exports.createRecord = async function(model, data) {

  const resolved = await Promise.resolve(data);

  const values = _.mapValues(resolved, value => {
    if (moment.isMoment(value)) {
      return value.toDate();
    } else {
      return value;
    }
  });

  return new model(values).save();
};

exports.checkRecord = async function(model, id, options) {
  if (!model) {
    throw new Error('Model is required');
  } else if (!id) {
    throw new Error('Record ID is required');
  }

  const idColumn = _.get(options, 'idColumn', 'api_id');
  const record = await new model().where(idColumn, id).fetch();
  if (!record) {
    throw new Error(`No database record found with ID ${id}`);
  }

  return record;
};

exports.toArray = function(value) {
  return _.isArray(value) ? value : [ value ];
};
