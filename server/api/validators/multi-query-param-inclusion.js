
const { isString } = require('lodash');

/**
 * Validates that the value of the query param whose name is given is included in a list of authorized values.
 * The query param value can either be a single string value or an array of strings value,
 * in which case, each string will be validated against the list of authorized values.
 *
 *      this.validate(
 *        this.multiQueryParamInclusion('include', ['theme', 'type'])
 *      )
 *
 * @param {string} queryParam - The name of the query param to validate.
 * @param {...string} existingRelations - A list of authorized values.
 * @returns {function} A validator function.
 */
module.exports = function(queryParam, ...inclusionValues) {
  return function(ctx) {
    return ctx.validate(
      ctx.query(queryParam),
      ctx.while(ctx.isSet()),
      ctx.notBlank(),
      ctx.type('string', 'array'),
      ctx.ifElse(
        context => isString(context.get('value')),
        ctx.inclusion(...inclusionValues),
        ctx.each((contxt, relation, i) => {
          return contxt.validate(
            context => context.set({
              location: `${context.get('location')}[${i}]`,
              value: contxt.get('value')[i]
            }),
            contxt.inclusion(...inclusionValues)
          );
        })
      )
    );
  };
};
