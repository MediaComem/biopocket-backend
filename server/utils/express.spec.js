const { expect } = require('../spec/utils');
const { ensureRequest } = require('./express');

describe('Express utilities', function() {
  describe('ensureRequest', function() {
    it('should throw an error if no value is provided', function() {
      expect(() => ensureRequest()).to.throw('Argument must be an Express request');
    });

    it('should throw an error if an object that is not an Express request is provided', function() {
      expect(() => ensureRequest({})).to.throw('Argument must be an Express request');
    });

    it('should allow the error message to be customized', function() {
      expect(() => ensureRequest({}, 'First argument')).to.throw('First argument must be an Express request');
    });
  });
});
