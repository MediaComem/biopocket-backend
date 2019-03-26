/**
 * Test utilities to generate registration-related data.
 *
 * @module server/spec/fixtures/registration
 */
const chance = require('chance').Chance();

const Registration = require('../../models/registration');
const { createRecord } = require('../utils');

/**
 * Generates a random registration record and saves it to the database.
 *
 * All of the generated registration's properties are assigned random values unless
 * changed with the `data` argument.
 *
 *     const registrationFixtures = require('../spec/fixtures/registration');
 *
 *     const registration = await registrationFixtures.registration({
 *       firstname: 'Gerard'
 *     });
 *
 *     console.log(registration.get('firstname'));        // "Gerard"
 *     console.log(registration.get('lastname'));  // "Yoejg"
 *
 * @function
 * @param {Object} [data={}] Custom registration data.
 * @param {string} [data.firstname] The person's firstname.
 * @param {string} [data.lastname] The person's lastname.
 * @param {string} [data.email] The person's email.
 * @returns {Promise<Registration>} A promise that will be resolved with the saved registration.
 */
exports.registration = function(data = {}) {
  return createRecord(Registration, {
    firstname: data.firstname || chance.first(),
    lastname: data.lastname || chance.last(),
    email: data.email || chance.email()
  });
};
