const { isEmpty, isString } = require('lodash');

const User = require('../../models/user');

/**
 * Creates a validator to make sure that an email address is available (i.e. not
 * taken by another user).
 *
 * @param {User} [existingUser] The user, if checking availability for an
 *   existing user. This allows the validator to avoid finding the user being
 *   modified, since we are only interested in whether another user is using the
 *   email.
 * @returns {ValidatorFunc} A valdsl validator function.
 */
exports.emailAvailable = function(existingUser) {
  return async function(context) {

    const email = context.get('value');

    // Ignore the value if blank (use other validators to check the type & format).
    if (!isString(email) || isEmpty(email.trim())) {
      return;
    }

    let query = User.whereEmail(email);

    if (existingUser) {
      // Omit the existing user from the search.
      query = query.query(function(queryBuilder) {
        queryBuilder.whereNot('id', existingUser.get('id'));
      });
    }

    const user = await query.fetch();
    if (user) {
      context.addError({
        validator: 'user.emailAvailable',
        message: 'is already taken'
      });
    }
  };
};
