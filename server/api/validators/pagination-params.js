/**
 * Returns a ValDSL function that will validate that both `offset` and `limit` query params have valid values (if present).
 *
 * This validation function should be used on routes that can have pagination features.
 *
 * @module server/api/validators/pagination-params
 *
 * @returns {function} A validation function
 */
module.exports = function() {
  return function(ctx) {
    return ctx.validate(
      ctx.validate(
        ctx.query('offset'),
        ctx.while(ctx.isSet()),
        ctx.notBlank(),
        ctx.isPositiveInteger()
      ),
      ctx.validate(
        ctx.query('limit'),
        ctx.while(ctx.isSet()),
        ctx.notBlank(),
        ctx.isPositiveInteger()
      )
    );
  };
};
