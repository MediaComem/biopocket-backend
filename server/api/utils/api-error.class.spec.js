const { expect } = require('../../spec/utils');
const ApiError = require('./api-error.class');

describe('ApiError class', () => {
  it('should behave as expected', function() {
    const error = new ApiError(404, 'error.test', 'This is a test ApiError.');

    expect(error).to.be.an.instanceOf(Error);
    expect(error.name).to.equal('ApiError');
    expect(error.stack).not.to.equal(null);
  });

  it('should throw a TypeError if no status parameter is given or is not an integer', function() {
    expect(() => new ApiError()).to.throw(TypeError, 'The status argument must be a integer ; undefined given');
    expect(() => new ApiError('foo')).to.throw(TypeError, 'The status argument must be a integer ; string given');
  });

  it('should throw a TypeError if no code parameter is given or is not a string', function() {
    expect(() => new ApiError(404)).to.throw(TypeError, 'The code argument must be a string ; undefined given');
    expect(() => new ApiError(404, 416)).to.throw(TypeError, 'The code argument must be a string ; number given');
  });

  describe('header method', () => {
    let error;
    beforeEach(() => {
      error = new ApiError(404, 'error.test', 'This is a test ApiError.');
    });

    it('should throw a TypeError if no value parameter is given or is not a string', function() {
      expect(() => error.header()).to.throw(TypeError, 'A name argument is required as the first argument to the header method, and it must be a string ; undefined given');
      expect(() => error.header(42)).to.throw(TypeError, 'A name argument is required as the first argument to the header method, and it must be a string ; number given');
    });

    it('should throw a TypeError if no value parameter is given', function() {
      expect(() => error.header('header-name')).to.throw(TypeError, 'A value argument is required as the second argument to the header method');
    });

    it('should add the new header to the headers property', function() {
      error.header('header-name', 'header-value');

      expect(error.headers).to.eql({ 'header-name': 'header-value' });
    });

    it('should correctly override the value of a previously set header', function() {
      error.header('header-name', 'foo');
      error.header('header-name', 'bar');

      expect(error.headers).to.eql({ 'header-name': 'bar' });
    });
  });
});
