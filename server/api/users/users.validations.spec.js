const { expect } = require('../../spec/chai');
const userFixtures = require('../../spec/fixtures/user');
const { createValidationContextWithValue } = require('../../spec/utils/validation');
const { emailAvailable } = require('./users.validations');

// This suite tests cases not covered by the API tests.
describe('emailAvailable validator', function() {
  it('should ignore an invalid email (other validators should be used to check the type & format)', async function() {

    for (const invalid of [ undefined, null, 666, false, true, {}, '', '   ' ]) {

      const context = createValidationContextWithValue(invalid);

      // Make sure there is at least one user in the database.
      await userFixtures.user();

      const validator = emailAvailable();
      await validator(context);

      // No error should have been added.
      expect(context.hasError()).to.equal(false);
    }
  });
});
