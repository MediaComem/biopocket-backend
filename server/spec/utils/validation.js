const { dsl } = require('../../api/utils/validation');

/**
 * Creates a valdsl validation context with the specified current value. It can
 * then be passed to a valdsl validation function for testing.
 *
 * @param {*} value - The value being validated.
 * @returns {ValidationContext} A valdsl validation context.
 */
exports.createValidationContextWithValue = function(value) {

  const context = new dsl.ValidationContext();
  context.set('value', value);

  return context;
};
