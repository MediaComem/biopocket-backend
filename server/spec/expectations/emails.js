const { get, isFunction, isRegExp } = require('lodash');

const config = require('../../../config');
const { testMails } = require('../../utils/mailer');
const { expect } = require('../utils');

/**
 * Asserts that exactly one test email was sent.
 *
 * @param {Object} expected - Expected properties of the email.
 * @param {string} expected.to - The email's recipient (an email address).
 * @param {string} expected.subject - The email's subject.
 * @param {string} [expected.from] - The email's sender (defaults to the configured sender email address).
 * @param {Function|RegExp|string} [expected.text] - If a function is given,
 *   true is expected to be returned when the function is called with the email's
 *   text. If a regular expression is given, the email's text is expected to match
 *   it. If a string is given, the email's text is expected to be exactly that
 *   text. Otherwise, the email's text is simply expected to be present and to be
 *   a string.
 * @returns {Object} The validated email.
 */
exports.expectEmailSent = function(expected) {

  expect(testMails).to.have.lengthOf(1);

  const email = testMails[0];
  expect(email).to.be.an('object');
  expect(email.from, 'email.from').to.equal(get(expected, 'from', `"${config.mail.fromName}" <${config.mail.fromAddress}>`));
  expect(email.subject, 'email.subject').to.equal(expected.subject);
  expect(email.to, 'email.to').to.equal(expected.to);

  // TODO: validate HTML email content.
  expect(email.html).to.equal(undefined);

  if (isFunction(expected.text)) {
    expect(email.text).to.satisfy(expected.text);
  } else if (isRegExp(expected.text)) {
    expect(email.text).to.match(expected.text);
  } else if (expected.text) {
    expect(email.text).to.equal(expected.text);
  } else {
    expect(email.text).to.be.a('string');
  }

  return testMails[0];
};

/**
 * Asserts that no test emails were sent.
 */
exports.expectNoEmailsSent = function() {
  expect(testMails).to.eql([]);
};
