const config = require('../../../config');
const { expect } = require('../../spec/utils');
const { getAbsoluteImageUrl, processMarkdownImages } = require('./images');

describe('API image utilities', function() {
  describe('getAbsoluteImageUrl', function() {
    it('should prepend the configured images base URL to relative paths', function() {
      expect(getAbsoluteImageUrl('hello.jpg')).to.equal(`${config.imagesBaseUrl}/hello.jpg`);
    });

    it('should not modify an absolute image URL', function() {
      expect(getAbsoluteImageUrl('http://example.com/images/hello.jpg')).to.equal('http://example.com/images/hello.jpg');
    });

    it('should not modify a protocol-relative URL', function() {
      expect(getAbsoluteImageUrl('//example.com/images/hello.jpg')).to.equal('//example.com/images/hello.jpg');
    });
  });

  describe('processMarkdownImages', function() {
    it('should replace relative image URLs in markdown', function() {

      const markdown = `Lorem [ipsum](hello.jpg) dolor sit amet, consectetur adipiscing elit. Etiam ultrices auctor porttitor. [Sed](https://en.wikipedia.org/wiki/Sed) convallis condimentum faucibus. Cras [a](//a) luctus nisi. Phasellus lobortis, odio vitae pharetra tristique, tortor odio varius nulla, a porta nisi nisi sit amet nulla.

Nam pellentesque elit mauris, a molestie lectus venenatis vitae. [Integer
quis](foo/bar.png) pulvinar enim. Quisque fermentum enim ac nunc vestibulum
fermentum et et elit. Maecenas ac libero gravida, blandit purus a, eleifend
enim. Nulla vulputate nibh magna, at vehicula metus convallis non.`;

      const expected = `Lorem [ipsum](${config.imagesBaseUrl}/hello.jpg) dolor sit amet, consectetur adipiscing elit. Etiam ultrices auctor porttitor. [Sed](https://en.wikipedia.org/wiki/Sed) convallis condimentum faucibus. Cras [a](//a) luctus nisi. Phasellus lobortis, odio vitae pharetra tristique, tortor odio varius nulla, a porta nisi nisi sit amet nulla.

Nam pellentesque elit mauris, a molestie lectus venenatis vitae. [Integer
quis](${config.imagesBaseUrl}/foo/bar.png) pulvinar enim. Quisque fermentum enim ac nunc vestibulum
fermentum et et elit. Maecenas ac libero gravida, blandit purus a, eleifend
enim. Nulla vulputate nibh magna, at vehicula metus convallis non.`;

      expect(processMarkdownImages(markdown)).to.equal(expected);
    });
  });
});
