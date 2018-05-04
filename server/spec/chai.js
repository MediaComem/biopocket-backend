const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const chaiIso8601 = require('chai-iso8601');
const chaiMoment = require('chai-moment');
const chaiObjects = require('chai-objects');
const sinonChai = require('sinon-chai');

chai.use(chaiAsPromised);
chai.use(chaiIso8601());
chai.use(chaiMoment);
chai.use(chaiObjects);
chai.use(sinonChai);

module.exports = chai;
