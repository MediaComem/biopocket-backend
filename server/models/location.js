const Abstract = require('./abstract');
const db = require('../db');

const proto = Abstract.prototype;

/**
 * A location of interest in the BioPocket platform, such as a travel office or biodiversity landmark.
 *
 * ## Database columns
 *
 * * **id** (`bigint`) - Internal ID (used for joins).
 * * **api_id** (`uuid`) - External ID (used in the API).
 * * **name** (`string`, max 150 chars) - Full name of the location.
 * * **short_name** (`string`, optional, max 30 chars) - Optional short name of the location.
 * * **address_street** (`string`, max 150 chars)
 * * **address_number** (`string`, optional, max 10 chars) - Optional address number (there may not be a number for some addresses like lieux-dits).
 * * **address_zip_code** (`string`, max 15 chars)
 * * **address_city** (`string`, max 100 chars)
 * * **address_state** (`string`, max 30 chars)
 * * **description** (`text`)
 * * **photo_url** (`string`, max 500 chars)
 * * **site_url** (`string`, max 500 chars)
 * * **phone** (`string`, max 20 chars)
 * * **geometry** (`point`) - Geographical coordinates of the location.
 * * **properties** (`json`) - Extra user-defined properties.
 * * **created_at** (`datetime`) - Time at which the location was created.
 * * **updated_at** (`datetime`) - Time at which the location was last modified (equal to the creation date if never modified).
 *
 * @class
 * @extends Abstract
 * @see http://bookshelfjs.org
 */
const Location = Abstract.extend({
  tableName: 'locations',

  geojson: 'geometry',
  returningProperties: [ '*', db.st.asGeoJSON('geometry') ],
  timestamps: true
});

module.exports = db.bookshelf.model('Location', Location);
