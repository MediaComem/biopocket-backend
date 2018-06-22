const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const chaiIso8601 = require('chai-iso8601');
const chaiMoment = require('chai-moment');
const chaiObjects = require('chai-objects');
const chaiString = require('chai-string');
const sinonChai = require('sinon-chai');

const timestampCloseAfter = require('./assertions/timestamp-close-after');

chai.use(chaiAsPromised);
chai.use(chaiIso8601());
chai.use(chaiMoment);
chai.use(chaiObjects);
chai.use(chaiString);
chai.use(sinonChai);
chai.use(timestampCloseAfter);

module.exports = chai;
