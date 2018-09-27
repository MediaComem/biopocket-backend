const Registration = require('../../models/registration');

/**
 * Anyone can create a registration.
 *
 * @function
 * @name canCreate
 * @memberof module:server/api/registrations
 *
 * @returns {boolean} `true` if user can create, `false` otherwise
 */
exports.canCreate = function() {
  return true;
};

/**
 * Anyone can retrieve a registration by its e-mail.
 *
 * @function
 * @name retrieveByEmail
 * @memberof module:server/api/registrations
 *
 * @returns {boolean} `true` if user can check availability, `false` otherwise
 */
exports.canRetrieveByEmail = function() {
  return true;
};

/**
 * Update a existing or new registratin with the specified data.
 *
 * @function
 * @name parse
 * @memberof module:server/api/registrations
 *
 * @param {Object} data - The data (with camel-case property names), typically an API request body.
 * @param {Registration} [registration] - The Registration to update. Leave blank for a new Registration.
 * @returns {Registration} - The new or updated Registration.
 */
exports.parse = function(data, registration = new Registration()) {
  registration.parseFrom(data, [ 'firstname', 'lastname', 'email' ]);
  registration.set('email', registration.get('email').toLowerCase());
  return registration;
};

/**
 * Serializes a registration for API responses.
 *
 * @function
 * @name serialize
 * @memberof module:server/api/registrations
 *
 * @param {Request} req - The Express request object.
 * @param {Registration} registration - A registration record.
 * @returns {Object} A serialized registration.
 */
exports.serialize = function(req, registration) {

  const serialized = {
    id: registration.get('api_id')
  };

  registration.serializeTo(serialized, [ 'firstname', 'lastname', 'email', 'created_at', 'updated_at' ]);

  return serialized;
};
