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
    } catch (err) {
      throw enrichApiError(err, res);
    }
  }
}

const httpMethods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];

const expect = exports.expect = chai.expect;

/**
 * Tests that the given path does not allow request with any given HTTP methods.
 * One test is created for each of the given methods and expects that :
 * * The response's status is 405
 * * The response contains the correct error object
 * * The response's headers contain a `Allow` header with the allowed methods 
 * 
 * @param {string} path - The path to test
 * @param {array} allowedMethods - An array of the methods to test on the path
 */
exports.expectMethodsNotAllowed = async function(path, allowedMethods) {
  const methodToTest = _.difference(httpMethods, allowedMethods);

  _.each(methodToTest, method => {
    it(`should not allow request with ${method} method`, async function() {
      const res = this.test.res = await exports.initSuperRest().test(method, path, {}, { expectedStatus: 405 });

      exports.expectErrors(res, {
        code: 'method.notAllowed',
        message: 'The method received in the request-line is known by the origin server but not supported by the target resource.'
      });

      expect(res.headers.allow).to.equal(allowedMethods.join(', '));
    });  
  });
}

/**
 * Ensures that a database record has been deleted by attempting to reload a fresh instance.
 *
 * @param {object} record - A database record (an instance of a Bookshelf model).
 * @param {options} [options] - Options.
 * @param {string} [options.idColumn="api_id"] - The column uniquely identifying the record.
 * @returns {Promise} A promise that is resolved if no record with the same ID is found in the database, or rejected if one is found.
 */
exports.expectDeleted = async function(record, options) {
  if (!record) {
    throw new Error('Record is required');
  }

  options = options || {};
  const idColumn = options.idColumn || 'api_id';

  const id = record.get(idColumn);
  if (!id) {
    throw new Error('Record must have an ID');
  }

  const Model = record.constructor;
  const freshRecord = await new Model({ [idColumn]: id }).fetch();

  expect(freshRecord).to.equal(null);
};

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

/**
 * Ensures that a database record has not changed by reloading a fresh instance and comparing its attributes.
 *
 * @param {object} record - A database record (an instance of a Bookshelf model).
 * @param {object} [options] - Options.
 * @param {string} [options.idColumn="api_id"] - The column uniquely identifying the record.
 * @returns {Promise} A promise that is resolved if the record has not changed, or rejected if it has changed.
 */
exports.expectUnchanged = async function(record, options) {
  if (!record) {
    throw new Error('Record is required');
  }

  options = options || {};
  const idColumn = options.idColumn || 'api_id';

  const id = record.get(idColumn);
  if (!id) {
    throw new Error('Record must have an ID');
  }

  const Model = record.constructor;
  const freshRecord = await new Model({ [idColumn]: id }).fetch();

  expect(freshRecord).to.be.ok;
  expect(freshRecord.attributes).to.eql(record.attributes);
};

/**
 * Expects that the given record has a `created_at` and an `updated_at` property
 * that are instances of Date.
 * By default, also expects that both have the same value.
 * You can pass an `hasBeenCreated` option to `false`, in which case the `updated_at` property should be after the `created_at` property.
 * @param {object} record - A database record (an instance of a Bookshelf model).
 * @param {object} [options] - Options.
 * @param {string} [options.hasBeenCreated="true"] - Indicates wether the given record has just been created or not.
 */
exports.expectTouchTimestamps = function(record, options) {
  const created = record.get('created_at');
  if (!created) {
    throw new Error('Record must have a created_at property!');
  }

  const updated = record.get('updated_at');
  if (!updated) {
    throw new Error('Record must have an updated_at property!');
  }

  options = options || { hasBeenCreated: true }

  expect(created).to.be.an.instanceOf(Date);
  expect(updated).to.be.an.instanceOf(Date);
  if (options.hasBeenCreated) {
    expect(updated, 'record updated_at').to.be.sameMoment(created);
  } else {
    expect(updated, 'record updated_at').to.be.afterMoment(created);
  }
}

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
    ['locations', 'users', 'actions'],
    ['themes']
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
  return _.isArray(value) ? value : [value];
};
