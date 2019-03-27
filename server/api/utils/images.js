const config = require('../../../config');
const { joinUrl } = require('./api');

exports.getAbsoluteImageUrl = function(relativePath) {
  return joinUrl(config.imagesBaseUrl, relativePath);
};

exports.processMarkdownImages = function(markdown) {
  return markdown.replace(/\[([^[\]]+)\]\(([^)\s]+\.(gif|jpe?g|png))\)/g, (match, alt, url) => `[${alt}](${joinUrl(config.imagesBaseUrl, url)})`);
};
