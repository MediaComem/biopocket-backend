const { expect, expectValidatorErrors } = require('../../spec/utils');
const { dsl } = require('../utils/validation');
const multiQueryParamInclusionValidator = require('../validators/multi-query-param-inclusion');

describe('Multi query params inclusion validator', function() {

  it('should be a function', function() {
    expect(multiQueryParamInclusionValidator).to.be.a('function');
  });

  it('should create a validator function', function() {
    expect(multiQueryParamInclusionValidator()).to.be.a('function');
  });

  it('should add no error when a single-valued param is valid', async function() {
    const err = await validate('foo');
    expect(err).to.equal(undefined);
  });

  it('should add no error when a multi-valued param is valid', async function() {
    const err = await validate([ 'foo', 'bar' ]);
    expect(err).to.equal(undefined);
  });

  it('should add an error if the param is empty', async function() {
    const err = await validate('');
    expectValidatorErrors(err, [
      {
        message: 'must not be blank',
        type: 'query',
        location: 'include',
        validator: 'notBlank',
        value: '',
        valueSet: true
      }
    ]);
  });

  it('should add an error if a single-valued param is invalid', async function() {
    const err = await validate('baz');
    expectValidatorErrors(err, [
      inclusionError('include', 'baz')
    ]);
  });

  it('should add an error if a multi-valued param has at least one invalid value', async function() {
    const err = await validate([ 'baz', 'qux' ]);
    expectValidatorErrors(err, [
      inclusionError('include[0]', 'baz'),
      inclusionError('include[1]', 'qux')
    ]);
  });

  /**
   * Validates that the given param value is included in the authorized values.
   * In this context, the authorized values are : 'foo' and 'bar'.
   *
   * @private
   * @param {string|array} value - The value to test.
   * @returns {Promise<Error>} A promise that will be resolved with the validation error.
   */
  async function validate(value) {
    let validationError;

    const req = {
      query: {
        include: value
      }
    };

    await dsl(function(ctx) {
      return ctx.validate(
        ctx.value(req),
        ctx.while(ctx.noError(ctx.atCurrentLocation())),
        multiQueryParamInclusionValidator('include', 'foo', 'bar')
      );
    }).catch(err => {
      validationError = err;
    });

    return validationError;
  }

  /**
   * Returns an inclusion error object whose `location` and `value` properies are set with the given location and value params.
   *
   * @param {string} location - The error's location name.
   * @param {string} value - The error's value.
   * @returns {Object} A inclusion error object.
   */
  function inclusionError(location, value) {
    return {
      message: 'must be one of foo, bar',
      type: 'query',
      location: location,
      validator: 'inclusion',
      allowedValues: [
        'foo',
        'bar'
      ],
      allowedValuesDescription: 'foo, bar',
      value: value,
      valueSet: true
    };
  }
});
