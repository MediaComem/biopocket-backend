const { expect } = require('../../spec/utils');
const { joinUrl } = require('./api');

describe('API utilities', function() {
  describe('joinUrl', function() {
    it('should join URL fragments together', function() {
      expect(joinUrl('http://example.com/', '/foo/', 'bar/', 'baz')).to.equal('http://example.com/foo/bar/baz');
      expect(joinUrl('http://example.com/foo/', '/bar/', 'baz')).to.equal('http://example.com/foo/bar/baz');
    });

    it('should handle absolute URLs', function() {
      expect(joinUrl('http://example.com', '/foo', 'http://other.com', 'bar')).to.equal('http://other.com/bar');
    });

    it('should handle protocol-relative URLs', function() {
      expect(joinUrl('http://example.com', '/foo', '//protocol/relative/url')).to.equal('//protocol/relative/url');
    });
  });
});
