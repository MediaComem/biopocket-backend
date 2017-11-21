const db = require('../db');

/**
 * Abstract database model.
 *
 * @class
 * @extends bookshelf.Model
 */
const Abstract = db.bookshelf.Model.extend({});

module.exports = Abstract;
