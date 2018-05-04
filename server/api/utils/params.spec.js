const { expect } = require('../../spec/utils');
const { singleValue, multiValue } = require('./params');

describe('API param utilities', function() {
  describe('singleValue', function() {
    it('should return a value unchanged by default', function() {
      expect(singleValue('foo')).to.equal('foo');
      expect(singleValue(undefined)).to.equal(undefined);
    });

    it('should coerce values that are not undefined', function() {
      expect(singleValue(undefined, String)).to.equal(undefined);
      expect(singleValue(42, String)).to.equal('42');
    });
  });

  describe('multiValue', function() {
    it('should return an array unchanged by default', function() {
      expect(multiValue([ 'foo', 42 ])).to.eql([ 'foo', 42 ]);
    });

    it('should return an empty array if the value is undefined', function() {
      expect(multiValue()).to.eql([]);
    });

    it('should wrap a single value into an array', function() {
      expect(multiValue(42)).to.eql([ 42 ]);
    });

    it('should coerce values with the specified function', function() {
      expect(multiValue([ 'foo', 42, true ], String)).to.eql([ 'foo', '42', 'true' ]);
    });

    it('should filter values with the specified function', function() {
      expect(multiValue([ 'foo', 'bar', 'baz' ], undefined, value => value.match(/ba/))).to.eql([ 'bar', 'baz' ]);
    });
  });
});
