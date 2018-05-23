const { noop } = require('lodash');

const { expect } = require('../../spec/utils');
const utils = require('./validation');

describe('Validation Utils', () => {

  const validateValue = utils.validateValue;

  describe('validateValue', () => {
    it('should set the status of the validation error to a default value', async () => {

      let validationError;
      await validateValue('foo', 422, () => {
        const error = new Error('validation error');
        error.errors = [ { message: 'bug' } ];
        throw error;
      }).catch(err => {
        validationError = err;
      });

      expect(validationError).to.be.an.instanceof(Error);
      expect(validationError.message).to.equal('validation error');
      expect(validationError.errors).to.eql([ { message: 'bug' } ]);
      expect(validationError.status).to.equal(422);
    });

    it('should not change the status of a non-validation error', async () => {

      let nonValidationError;
      await validateValue('foo', 422, () => {
        const error = new Error('authorization error');
        error.status = 403;
        throw error;
      }).catch(err => {
        nonValidationError = err;
      });

      expect(nonValidationError).to.be.an.instanceof(Error);
      expect(nonValidationError.message).to.equal('authorization error');
      expect(nonValidationError.status).to.equal(403);
    });

    it('should not accept an invalid status code', () => {
      expect(() => validateValue('foo', undefined, noop)).to.throw('Status must be an HTTP status code between 100 and 599, got undefined');
      expect(() => validateValue('foo', noop)).to.throw('Status must be an HTTP status code between 100 and 599, got function');
      expect(() => validateValue('foo', -200, noop)).to.throw('Status must be an HTTP status code between 100 and 599, got -200');
      expect(() => validateValue('foo', 1000, noop)).to.throw('Status must be an HTTP status code between 100 and 599, got 1000');
    });

    it('should require at least one callback', () => {
      expect(() => validateValue('foo', 422)).to.throw('At least one callback is required');
    });

    it('should require all callbacks to be functions', () => {
      expect(() => validateValue('foo', 422, noop, 'bar')).to.throw('Additional arguments must be functions');
    });
  });
});
