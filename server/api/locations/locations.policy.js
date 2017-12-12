const Location = require('../../models/location');
const { hasRole, jsonToColumns } = require('../utils/policy');

exports.canCreate = function(req) {
  return hasRole(req, 'admin');
};

exports.parse = function(data, location = new Location()) {
  location.parseFrom(data, [ 'name', 'shortName', 'description', 'phone', 'photoUrl', 'siteUrl', 'geometry', 'properties' ]);
  location.parseFrom(data, [ 'street', 'number', 'zipCode', 'city', 'state' ], { columnPrefix: 'address_', sourcePrefix: 'address.' });
  return location;
};

exports.serialize = function(req, location) {

  const serialized = {
    id: location.get('api_id')
  };

  location.serializeTo(serialized, [ 'name', 'short_name', 'description', 'photo_url', 'site_url', 'phone', 'geometry', 'properties', 'created_at', 'updated_at' ]);
  location.serializeTo(serialized, [ 'street', 'number', 'zip_code', 'city', 'state' ], { columnPrefix: 'address_', targetPrefix: 'address.' });

  return serialized;
};
