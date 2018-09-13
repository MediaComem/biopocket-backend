const db = require('../db');
const Abstract = require('./abstract');

/**
 * A person's registration to BioPocket news and updates.
 *
 * ## Database columns
 *
 * * **id** (`bigint`) - Internal ID.
 * * **firstname** (`string`) - The firstname of the subscriber.
 * * **lastname** (`string`) - The lastname of the subscriber.
 * * **email** (`string`) - The email to contact the subscriber with.
 *
 * * **created_at** (`datetime`) - Time at which the registration's been registered.
 * * **updated_at** (`datetime`) - Time at which the registration's been modified (equal to the creation date if never modified).
 */
const Registration = Abstract.extend({
  tableName: 'registrations',
  timestamps: [ 'created_at', 'updated_at' ]
});

module.exports = db.bookshelf.model('Registration', Registration);
