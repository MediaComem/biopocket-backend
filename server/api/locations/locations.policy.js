const Location = require('../../models/location');
const { hasRole } = require('../utils/policy');

/**
 * An administrator can create a location.
 *
 * @function
 * @name canCreate
 * @memberof module:server/api/locations
 *
 * @param {Request} req - The Express request object.
 * @returns {boolean} True if authorized.
 */
exports.canCreate = function(req) {
  return hasRole(req, 'admin');
};

/**
 * Anyone can list locations.
 *
 * @function
 * @name canList
 * @memberof module:server/api/locations
 *
 * @returns {boolean} True if authorized.
 */
exports.canList = function() {
  return true;
};

/**
 * Anyone can retrieve a location.
 *
 * @function
 * @name canRetrieve
 * @memberof module:server/api/locations
 *
 * @returns {boolean} True if authorized.
 */
exports.canRetrieve = function() {
  return true;
};

/**
 * An administrator can update a location.
 *
 * @function
 * @name canUpdate
 * @memberof module:server/api/locations
 *
 * @param {Request} req - The Express request object.
 * @returns {boolean} True if authorized.
 */
exports.canUpdate = function(req) {
  return hasRole(req, 'admin');
};

/**
 * An administrator can destroy a location.
 *
 * @function
 * @name canDestroy
 * @memberof module:server/api/locations
 *
 * @param {Request} req - The Express request object.
 * @returns {boolean} True if authorized.
 */
exports.canDestroy = function(req) {
  return hasRole(req, 'admin');
};

/**
 * Updates a location with the specified data.
 *
 * @function
 * @name parse
 * @memberof module:server/api/locations
 *
 * @param {Object} data - The data (with camel-case property names), typically an API request body.
 * @param {Location} [location] - The location to update.
 * @returns {Location} The updated location.
 */
exports.parse = function(data, location = new Location()) {

  location.parseFrom(data, [ 'name', 'shortName', 'description', 'phone', 'photoUrl', 'siteUrl', 'geometry', 'properties' ]);
  location.parseFrom(data, [ 'street', 'number', 'zipCode', 'city', 'state' ], { columnPrefix: 'address_', sourcePrefix: 'address.' });

  return location;
};

/**
 * Serializes a location for API responses.
 *
 * @function
 * @name serialize
 * @memberof module:server/api/locations
 *
 * @param {Request} req - The Express request object.
 * @param {Location} location - A location record.
 * @returns {Object} A serialized location.
 */
exports.serialize = function(req, location) {

  const serialized = {
    id: location.get('api_id')
  };

  location.serializeTo(serialized, [ 'name', 'short_name', 'description', 'photo_url', 'site_url', 'phone', 'geometry', 'properties', 'created_at', 'updated_at' ]);
  location.serializeTo(serialized, [ 'street', 'number', 'zip_code', 'city', 'state' ], { columnPrefix: 'address_', targetPrefix: 'address.' });

  return serialized;
};
