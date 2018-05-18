/**
 * API validation utilities.
 *
 * You should be familiar with the [valdsl](https://github.com/AlphaHydrae/valdsl) validation library.
 *
 * @module server/api/utils/validation
 * @see https://github.com/AlphaHydrae/valdsl
 */
const _ = require('lodash');
const valdsl = require('valdsl');

const { ensureRequest } = require('../../utils/express');
const genericValidators = require('../validators/generic');
const geoJsonValidators = require('../validators/geojson');
const multiQueryInclusionValidator = require('../validators/multi-query-param-inclusion');
const paginationValidator = require('../validators/pagination-params');

const dsl = valdsl();

// Add our custom validators to the DSL.
dsl.dsl.extend(genericValidators);
dsl.dsl.extend({
  bboxString: geoJsonValidators.bboxString,
  geoJsonPoint: geoJsonValidators.point,
  validatePaginationQueryParams: paginationValidator,
  multiQueryParamInclusion: multiQueryInclusionValidator
});

exports.dsl = dsl;

/**
 * Asynchronously validates an arbitrary value with any number of validators.
 * This function returns a promise which is resolved if validation is
 * successful. It is rejected if validation fails.
 *
 * @param {*} value - The value to validate.
 * @param {number} status - The HTTP status code that the response should have if validation fails.
 * @param {function[]} callbacks - Validation callbacks.
 * @returns {Promise<ValidationContext>} A promise that will be resolved with
 *   an empty valdsl ValidationContext if validation was successful, or rejected
 *   with a valdsl ValidationErrorBundle containing the list of errors if validation
 *   failed.
 */
exports.validateValue = function(value, status, ...callbacks) {
  if (!_.isInteger(status) || status < 100 || status > 599) {
    throw new Error(`Status must be an HTTP status code between 100 and 599, got ${_.isFinite(status) ? status : typeof status}`);
  } else if (!callbacks.length) {
    throw new Error('At least one callback is required');
  } else if (_.find(callbacks, c => !_.isFunction(c))) {
    throw new Error('Additional arguments must be functions');
  }

  const validationPromise = dsl(function() {
    return this.validate(this.value(value), this.while(this.noError(this.atCurrentLocation())), ...callbacks);
  }).catch(function(err) {
    if (err.errors && !_.has(err, 'status')) {
      err.status = status;
    }

    return Promise.reject(err);
  });

  return toNativePromise(validationPromise);
};

/**
 * Asynchronously validates the body of the specified request with any number
 * of validators.  This function returns a promise which is resolved if
 * validation is successful. It is rejected if validation fails.
 *
 *     function validateAuthentication(req) {
 *       return validate.requestBody(req, function() {
 *         return this.parallel(
 *           this.validate(
 *             this.json('/email'),
 *             this.required(),
 *             this.type('string'),
 *             this.email()
 *           ),
 *           this.validate(
 *             this.json('/password'),
 *             this.required(),
 *             this.type('string'),
 *             this.notBlank()
 *           )
 *         );
 *       })
 *     }
 *
 * @param {Request} req - The Express request object to validate.
 *
 * @param {Object} [options] - Validation options (may be omitted).
 *
 * @param {number} [options.status=422] - The HTTP status code that the response should have if validation fails.
 *
 * @param {string[]} [options.types=["object"]] - The list of allowed types for the request body.
 *   Only a single object is considered valid by default, but you might want to specify `["array"]` for
 *   a batch operation (or both, i.e. `["array", "object"]`).
 *
 * @param {function[]} callbacks - Validation callbacks.
 *
 * @returns {Promise<ValidationContext>} A promise that will be resolved with
 *   an empty valdsl ValidationContext if validation was successful, or rejected
 *   with a valdsl ValidationErrorBundle containing the list of errors if validation
 *   failed.
 */
exports.validateRequestBody = function(req, options, ...callbacks) {
  ensureRequest(req, 'First argument');

  let actualOptions;
  if (_.isFunction(options)) {
    callbacks.unshift(options);
    actualOptions = {};
  }

  actualOptions = options || {};
  const status = actualOptions.status || 422;
  const types = actualOptions.types || [ 'object' ];

  return exports.validateValue(req, status, function() {
    return this.validate(this.property('body'), this.type(...types), ...callbacks);
  });
};

/**
 * Converts a custom promise to a native promise.
 *
 * @param {Promise} promise - The promise to convert.
 * @returns {Promise} A native promise.
 */
function toNativePromise(promise) {
  // FIXME: remove this fix when issue is resolved (https://github.com/petkaantonov/bluebird/issues/1404)
  return new Promise((resolve, reject) => promise.then(resolve, reject));
}
