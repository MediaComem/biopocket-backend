const chai = require('chai');
const chaiIso8601 = require('chai-iso8601');
const chaiMoment = require('chai-moment');
const chaiObjects = require('chai-objects');

chai.use(chaiIso8601({
  marginRequired: true
}));

chai.use(chaiMoment);

chai.use(chaiObjects);

module.exports = chai;
