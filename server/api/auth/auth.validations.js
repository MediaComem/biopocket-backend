const { has, isBoolean, isInteger } = require('lodash');

/**
 * Creates a validator to check that a value is a valid authentication lifespan.
 * An authentication lifespan must be either `true` (meaning that the default
 * lifespan should be used), `false` (meaning that the authentication should be
 * valid forever), or the number of seconds the authentication should remain
 * valid.
 *
 * @returns {ValidatorFunc} A valdsl validation function.
 */
exports.authenticationLifespan = function() {
  return context => {
    const value = context.get('value');
    if (!isBoolean(value) && (!isInteger(value) || value < 1)) {
      context.addError({
        validator: 'auth.lifespan',
        message: 'lifespan must be a boolean or a whole number of seconds greater than or equal to 1'
      });
    }
  };
};

/**
 * Creates a validator to check that an object does not have both a `password`
 * and a `registrationOtp` properties at the same time (authentication is done
 * with one or the other, never both).
 *
 * @returns {ValidatorFunc} A valdsl validation function.
 */
exports.credentialTypesExclusive = function() {
  return context => {
    const value = context.get('value');
    if (has(value, 'password') && has(value, 'registrationOtp')) {
      context.addError({
        validator: 'auth.credentialTypesExclusive',
        message: 'password and registration OTP cannot be used at the same time'
      });
    }
  };
};

/**
 * Creates a validator to check that an object has the `password` or the
 * `registrationOtp` property.
 *
 * @returns {ValidatorFunc} A valdsl validation function.
 */
exports.credentialsRequired = function() {
  return context => {
    const value = context.get('value');
    if (!has(value, 'password') && !has(value, 'registrationOtp')) {
      context.addError({
        validator: 'auth.credentialsRequired',
        message: 'password or registration OTP is required'
      });
    }
  };
};
