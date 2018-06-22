const db = require('../db');
const Abstract = require('./abstract');

/**
 * A BioPocket action, which is what the users can undertake.
 *
 * ## Database columns
 *
 * * **id** (`bigint`) - Internal ID (used for joins).
 * * **origin_id** (`bigint`, optional) - ID in interface.biopocket.ch (used for synchronization).
 * * **api_id** (`uuid`) - External ID (used in the API).
 * * **title** (`string`, max 40 chars) - The title of the action.
 * * **code** (`string`, optional, max 5 chars) - Internal designation of the action.
 * * **description** (`text`) - A quick description of the action's content.
 * * **theme_id** (`bigint`) - The ID of the action's theme
 * * **created_at** (`datetime`) - Time at which the action was created.
 * * **updated_at** (`datetime`) - Time at which the action was last modified (equal to the creation date if never modified).
 *
 * @class
 * @extends Abstract
 * @see http://bookshelfjs.org
 */
const Action = Abstract.extend({
  tableName: 'actions',
  timestamps: true,

  /**
   * Returns the relation to this action's theme.
   *
   * @returns {Model} A Bookshelf relation.
   */
  theme() {
    return this.belongsTo('Theme');
  }
});

module.exports = db.bookshelf.model('Action', Action);
