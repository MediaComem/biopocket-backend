const db = require('../db');
const Abstract = require('./abstract');

/**
 * A BioPocket action's theme
 *
 * ## Database columns
 *
 * * **id** (`bigint`) - Internal ID (used for joins).
 * * **origin_id** (`bigint`, optional) - ID in interface.biopocket.ch (used for synchronization).
 * * **api_id** (`uuid`) - External ID (used in the API).
 * * **title** (`string`, max 40 chars) - The title of the theme.
 * * **code** (`string`, optional, max 5 chars) - Internal designation of the theme.
 * * **description** (`text`) - The full description of the theme.
 * * **photo_url** (`string`, 500) - The URL to the picture illustrating the theme.
 * * **source** (`text`, optional) - Description of the picture's source
 * * **created_at** (`datetime`) - Time at which the theme was created.
 * * **updated_at** (`datetime`) - Time at which the theme was last modified (equal to the creation date if never modified).
 *
 * @class
 * @extends Abstract
 * @see http://bookshelfjs.org
 */
const Theme = Abstract.extend({
  tableName: 'themes',
  timestamps: true
});

module.exports = db.bookshelf.model('Theme', Theme);
