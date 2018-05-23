/**
 * @module server/api/validators/generic
 */
const _ = require('lodash');

/**
 * Returns a ValDSL validator that checks whether a value is strictly equal to a fixed value.
 *
 *     this.validate(
 *       this.json("/type"),
 *       this.equal("Point")
 *     );
 *
 * @param {*} value - The expected value.
 * @returns {function} A validator function.
 */
exports.equals = function(value) {
  return function(ctx) {
    if (ctx.get('value') !== value) {
      ctx.addError({
        validator: 'equal',
        message: `must be equal to ${JSON.stringify(value)}`
      });
    }
  };
};

/**
 * Returns a ValDSL condition that checks whether the current value is set and not null.
 *
 * Used when doing partial updates with PATCH, when the next validations should be run
 * only if the property is set and not null, otherwise the property should be cleared.
 *
 * @returns {function} A condition function.
 */
exports.isSetAndNotNull = function() {
  return function(ctx) {
    return ctx.get('valueSet') && ctx.get('value') !== null;
  };
};

/**
 * Returns a ValDSL validator that checks whether an object has exactly the expected properties.
 *
 *     this.validate(
 *       this.json("/geometry"),
 *       this.properties("type", "coordinates")
 *     )
 *
 * @param {string[]} properties - The expected properties.
 * @returns {function} A validator function.
 */
exports.properties = function(...properties) {
  return function(ctx) {

    const value = ctx.get('value');

    const actualProperties = value ? _.keys(value) : [];
    const missingProperties = _.difference(properties, actualProperties);
    const extraProperties = _.difference(actualProperties, properties);

    if (missingProperties.length) {
      ctx.addError({
        validator: 'properties',
        cause: 'missingProperties',
        message: `must have properties ${properties.map(property => `"${property}"`).join(', ')}`,
        expectedProperties: properties,
        missingProperties: missingProperties
      });
    }

    if (extraProperties.length) {
      ctx.addError({
        validator: 'properties',
        cause: 'extraProperties',
        message: `must not have other properties than ${properties.map(property => `"${property}"`).join(', ')}`,
        expectedProperties: properties,
        extraProperties: extraProperties
      });
    }
  };
};

/**
 * Returns a ValDSL function that changes the validated value from an Express request object to one of its query parameters.
 *
 * @param {string} param - The name of the query parameter to validate.
 * @returns {function} A validator function.
 */
exports.query = function(param) {
  return function(ctx) {

    const request = ctx.get('value');

    ctx.set({
      type: 'query',
      location: param,
      value: request.query[param],
      valueSet: _.has(request.query, param)
    });
  };
};
