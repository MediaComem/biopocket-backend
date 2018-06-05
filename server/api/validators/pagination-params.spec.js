const { expect, expectValidatorErrors } = require('../../spec/utils');
const { dsl } = require('../utils/validation');
const paginationParamsValidator = require('../validators/pagination-params');

describe('Pagination params validator', function() {
  it('should be a function', function() {
    expect(paginationParamsValidator).to.be.a('function');
  });

  it('should create a validator function', function() {
    expect(paginationParamsValidator()).to.be.a('function');
  });

  it('should add no error for valid offset and limit query parameters', async function() {
    const err = await validate({ query: { offset: '12', limit: '13' } });
    expect(err).to.equal(undefined);
  });

  it('should add an error if offset or limit are set but empty', async function() {
    const err = await validate({ query: { offset: '', limit: '' } });
    expectValidatorErrors(err, [ blankError('offset'), blankError('limit') ]);
  });

  it('should add an error if offset or limit are set but invalid', async function() {
    const err = await validate({ query: { offset: 'foo', limit: 'bar' } });
    expectValidatorErrors(err, [ typeError('offset', 'foo'), typeError('limit', 'bar') ]);
  });

  it('should add an error if offset or limit are set but not positive integers', async function() {
    const err = await validate({ query: { offset: '-15', limit: '-7' } });
    expectValidatorErrors(err, [ notPositiveIntegerError('offset', '-15'), notPositiveIntegerError('limit', '-7') ]);
  });

  /**
   * Validates the specified values as pagination params.
   *
   * @private
   * @param {Object} values - The pagination params values.
   * @param {string} [values.offset] - The value for the offset param.
   * @param {string} [values.limit] - The value for the limit param.
   * @returns {Promise<Error>} A promise that will be resolved with the validation error.
   */
  async function validate(values) {
    let validationError;

    await dsl(function(ctx) {

      return ctx.validate(
        ctx.value(values),
        ctx.while(ctx.noError(ctx.atCurrentLocation())),
        paginationParamsValidator()
      );
    }).catch(err => {
      validationError = err;
    });

    return validationError;
  }

  /**
   * Returns a blank error object whose `location` property is set with the given location name.
   *
   * @private
   * @param {string} location - The name of the error's location.
   * @returns {Object} The blank error object
   */
  function blankError(location) {
    return {
      message: 'must not be blank',
      type: 'query',
      location: location,
      validator: 'notBlank',
      value: '',
      valueSet: true
    };
  }

  /**
   * Returns a type error object whose `location` property is set with the given location name, and `value` property is set with the given value.
   *
   * @private
   * @param {string} location - The name of the error's location.
   * @param {string} value - The location's value.
   * @returns {Object} The type error object.
   */
  function typeError(location, value) {
    return {
      message: 'must be an integer',
      type: 'query',
      location: location,
      value: value,
      validator: 'positiveInteger',
      cause: 'wrongType',
      valueSet: true
    };
  }

  /**
   * Returns a not positive integer error whose `location` property is set with the given location name, and `value` property is set with the given value.
   *
   * @private
   * @param {string} location - The name of the error's location.
   * @param {string} value - The location's value.
   * @returns {Object} The not positive integer error object.
   */
  function notPositiveIntegerError(location, value) {
    return {
      message: 'must be equal or superior to 0',
      type: 'query',
      location: location,
      validator: 'positiveInteger',
      cause: 'wrongValue',
      value: value,
      valueSet: true
    };
  }
});
