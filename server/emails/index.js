/**
 * Mail templates.
 *
 * @module server/emails
 */
const glob = require('fast-glob');
const { compile: compileHandlebars } = require('handlebars');
const { isEmpty, isString, mapValues } = require('lodash');
const { basename: getBasename, dirname: getDirname, extname: getExtension, join: joinPath, relative: getRelativePath } = require('path');

const config = require('../../config');
const { loadFileWithFrontmatter } = require('../utils/frontmatter');

const logger = config.logger('emails');

const emails = {};
const emailsDir = config.path('server', 'emails');

/**
 * Returns an object containing the subject and body (text and optionally HTML)
 * for the specified email.
 *
 * @param {string} name - The email identifier, corresponding to a subdirectory in `server/emails`.
 * @param {string} locale - The locale to use to select the templates in the correct language.
 * @param {Object} [templateData={}] - Data to pass to the compiled Handlebars template function.
 * @returns {EmailOptions} Nodemailer options for the specified email.
 */
exports.buildEmailOptions = function(name, locale, templateData = {}) {
  if (!emails[name]) {
    throw new Error(`No email templates named "${name}" (looking in ${joinPath(emailsDir, name)})`);
  } else if (!emails[name][locale]) {
    throw new Error(`No email templates named "${name}" are available for locale "${locale}" (looking in ${joinPath(emailsDir, name)})`);
  }

  // Retrieve the prepared data for the email with the specified name and
  // locale, which has the following format:
  //
  //     {
  //       subject: "Welcome",
  //       templates: {
  //         html: handlebarsTemplateFunction,
  //         text: handlebarsTemplateFunction
  //       }
  //     }
  //
  // At this stage, the templates are Handlebars functions. They must be called
  // to produce the HTML/text for the email.
  const preparedData = emails[name][locale];
  return {
    // Include the subject.
    subject: preparedData.subject,
    // Map the `templates` object into an object with the same keys but with
    // values that are the rendered templates (HTML/text) obtained by calling
    // the Handlebars functions. Include these properties (`html` & `text`)
    // directly into the email options.
    ...mapValues(preparedData.templates, template => template(templateData))
  };
};

/**
 * Loads and precompiles all email templates in the `server/emails` directory.
 *
 * This function is intended to be used once while launching the server, to
 * avoid parsing email templates again at runtime. Call {@link
 * module:server/emails.buildEmailOptions} to use the compiled templates.
 */
exports.init = async function() {
  if (!isEmpty(emails)) {
    return;
  }

  // Load all email templates in the `server/emails` directory.
  const emailFiles = await glob('*/*.@(html|txt)', { absolute: true, cwd: emailsDir });

  // Extract metadata and compile Handlebars templates.
  const emailData = await Promise.all(emailFiles.map(loadEmailData));

  // Build the `emails` object with the following structure (for quick access later):
  //
  // {
  //   registration: {
  //     fr: {
  //       subject: "Welcome",
  //       templates: {
  //         html: handlebarsTemplateFunction,
  //         text: handlebarsTemplateFunction
  //       }
  //     },
  //     otherLocale: ...
  //   },
  //   otherMail: ...
  // }
  for (const data of emailData) {
    if (!emails[data.name]) {
      emails[data.name] = {};
    }

    if (!emails[data.name][data.locale]) {
      emails[data.name][data.locale] = {};
    }

    if (!emails[data.name][data.locale].templates) {
      emails[data.name][data.locale].templates = {};
    }

    const preparedData = emails[data.name][data.locale];

    // If an email has both an HTML and a text template and both define a subject
    // in their YAML frontmatter, make sure that the subject is the same. (It's
    // also possible to only define the subject in one template to avoid this
    // issue.)
    const subject = data.subject;
    if (subject !== undefined && preparedData.subject !== undefined && subject !== preparedData.subject) {
      throw new Error(`Subject "${subject}" differs from "${preparedData.subject}"; make sure that all email templates in ${joinPath(emailsDir, data.name)} have the same subject in their YAML frontmatter, or set the subject in only one of them`);
    } else if (subject !== undefined) {
      preparedData.subject = subject;
    }

    preparedData.templates[data.format] = data.template;
  }

  // Validate parsed email templates and metadata.
  for (const name in emails) {
    for (const locale in emails[name]) {
      const preparedData = emails[name][locale];
      if (!preparedData.subject) {
        throw new Error(`No email template in ${joinPath(emailsDir, name)} defines a subject; make sure one of them has YAML frontmatter with a "subject" property`);
      } else if (!preparedData.templates.text) {
        throw new Error(`Email template "${name}" does not have a text version (looking for ${joinPath(emailsDir, name, `${locale}.txt`)})`);
      }
    }
  }
};

/**
 * Loads metadata about an email template file and compiles it as a Handlebars
 * template. The metadata is derived from the file path and its YAML
 * frontmatter. The Handlebars template is compiled from the file's contents
 * (without the frontmatter).
 *
 * @param {string} file - The path to the file to load.
 * @returns {EmailData} Metadata and a compiled Handlebars template.
 */
async function loadEmailData(file) {

  const { contents, frontmatter } = await loadFileWithFrontmatter(file);

  if (!frontmatter.subject) {
    throw new Error(`Email template ${file} has no "subject" in its YAML frontmatter`);
  } else if (!isString(frontmatter.subject)) {
    throw new Error(`Email template ${file} has a "subject" that is not a string`);
  }

  const name = getBasename(getDirname(file));
  const extension = getExtension(file);
  const locale = getBasename(file, extension);
  const format = emailExtensionToFormat(extension);

  const template = compileHandlebars(contents);
  logger.trace(`Email template "${name}" (locale: ${locale}, format: ${format}) compiled from ${getRelativePath(config.root, file)}`);

  return {
    format,
    name,
    locale,
    subject: frontmatter.subject,
    template
  };
}

/**
 * Return the Nodemailer format name for an email template file based on its
 * extension:
 *
 * * `.txt` becomes `text`.
 * * `.html` becomes `html`.
 *
 * The format names should correspond to Nodemailer email configuration
 * properties (see {@link https://nodemailer.com/message/}).
 *
 * @param {string} extension - The extension of the email template file (with the dot).
 * @returns {string} The corresponding format name.
 */
function emailExtensionToFormat(extension) {
  switch (extension) {
    case '.txt':
      return 'text';
    case '.html':
      return 'html';
    default:
      throw new Error(`Unknown email template extension "${extension}"`);
  }
}

/**
 * Metadata of one of the email templates in the `server/emails` directory.
 *
 * @typedef {Object} EmailData
 * @property {string} format - The email format (see {@link module:server/emails~emailExtensionToFormat}).
 * @property {string} name - A name identifying the email (derived from the file's directory name).
 * @property {string} locale - The email locale (derived from the filename without the extension).
 * @property {string} [subject] - The subject of the email (extracted from the file's YAML frontmatter if present).
 * @property {Function} template - A Handlebars template function compiled from the file's contents (without its YAML frontmatter).
 */

/**
 * Nodemailer options for an email's contents.
 *
 * @typedef {Object} EmailOptions
 * @property {string} subject - The email subject.
 * @property {string} [html] - The HTML version of the email (if available).
 * @property {string} text - The plain text version of the email.
 */
