/**
 * Test utilities.
 *
 * @module server/spec/utils
 */
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

const expect = exports.expect = chai.expect;

/**
 * Ensures that a response from the server is a correctly formatted error response
 * and that it contains the expected error or list of errors.
 *
 *     // Expect a single error.
 *     expectErrors(res, {
 *       code: 'something.wrong',
 *       message: 'It went wrong...'
 *     });
 *
 *     // Expect a list of errors.
 *     expectErrors(res, [
 *       {
 *         code: 'something.wrong',
 *         message: 'It went wrong...'
 *       },
 *       {
 *         code: 'something.bad',
 *         message: 'What?'
 *       }
 *     ]);
 *
 * An error response is expected to:
 *
 * * Have the application/json content type
 * * Be a JSON object with a single `errors` property that is an array of errors
 *
 * @param {Response} res - A response object from a test.
 *
 * @param {object|object[]} - A single error or a list of errors that is expected to
 *   be in the response. The response is expected to contain exactly this or these
 *   errors and no others. If a single error is given, the response's `errors` array
 *   is expected to contain exactly that error and no other. If a list is given, the
 *   order of the errors is not checked.
 */
exports.expectErrors = function(res, expectedErrorOrErrors) {

  expect(res.get('Content-Type'), 'res.headers.Content-Type').to.match(/^application\/json/);
  expect(res.body, 'res.body').to.be.an('object');
  expect(res.body, 'res.body').to.have.all.keys('errors');
  expect(res.body.errors, 'res.body.errors').to.be.an('array');

  // Check that at least one expected error was provided.
  const expectedErrors = exports.toArray(expectedErrorOrErrors);
  expect(expectedErrors).to.have.lengthOf.at.least(1);

  // Check that the errors in the response match with chai-objects
  expect(res.body.errors).to.have.objects(expectedErrors);
};

exports.initSuperRest = function(options) {
  return new EnrichedSuperRest(app, _.defaults({}, options, {
    pathPrefix: '/api',
    updateMethod: 'PATCH'
  }));
};

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
