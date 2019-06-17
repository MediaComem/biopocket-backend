const { isObject } = require('lodash');
const nodemailer = require('nodemailer');
const smtpTransport = require('nodemailer-smtp-transport');
const { promisify } = require('util');

const config = require('../../config');

const logger = config.logger('mailer');
const transporter = createTransport();
const sendMail = promisify(transporter.sendMail.bind(transporter));

const testMails = [];
exports.testMails = testMails;

/**
 * Sends an email using the default Nodemailer transport.
 *
 * In test mode, emails are not sent, but are instead stored in the `testEmails`
 * array, which is exported from this module.
 *
 * @async
 * @function
 * @param {Object} options - Email properties.
 * @see {@link https://nodemailer.com/message/}
 */
exports.sendMail = async function(options) {
  if (!isObject(options)) {
    throw new Error('Mail options must be an object');
  } else if (!options.to) {
    throw new Error('Mail `to` option is required');
  } else if (!options.subject) {
    throw new Error('Mail `subject` option is required');
  } else if (!options.text) {
    throw new Error('Mail `text` option is required');
  }

  const start = new Date().getTime();

  const email = {
    from: config.mail.fromName ? `"${config.mail.fromName}" <${config.mail.fromAddress}>` : config.mail.fromAddress,
    html: options.html,
    to: options.to,
    subject: options.subject,
    text: options.text
  };

  if (!config.mail.enabled) {
    return;
  } else if (config.env === 'test') {
    // Store test emails in memory.
    testMails.push(email);
    return;
  }

  await sendMail(email);

  const duration = (new Date().getTime() - start) / 1000;
  logger.info(`Email "${email.subject}" sent to ${email.to} in ${duration}s`);
};

/**
 * Create a configured Nodemailer SMTP transport used to send emails.
 *
 * @see {@link https://nodemailer.com/smtp/}
 * @returns {NodemailerSmtpTransport} A Nodemailer transport.
 */
function createTransport() {

  const smtpOptions = {
    host: config.mail.host,
    port: config.mail.port,
    secure: config.mail.secure
  };

  if (config.mail.username || config.mail.password) {
    smtpOptions.auth = {
      user: config.mail.username,
      pass: config.mail.password
    };
  }

  return nodemailer.createTransport(smtpTransport(smtpOptions));
}
