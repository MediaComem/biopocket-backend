const { expect } = require('../spec/chai');
const userFixtures = require('../spec/fixtures/user');
const User = require('./user');

// This suite tests cases not covered by the API tests.
describe('User', function() {

  describe('checkPassword()', function() {
    it('should return false if the password is blank', async function() {
      const password = userFixtures.password();
      const user = await userFixtures.user({ password });
      expect(user.checkPassword(undefined)).to.equal(false);
      expect(user.checkPassword(null)).to.equal(false);
      expect(user.checkPassword('')).to.equal(false);
    });
  });

  describe('hashAndSetPassword()', function() {
    it('should throw an error if the password is not a string or blank', async function() {
      for (const invalid of [ undefined, null, 666, false, true, {} ]) {
        await expect(new User().hashAndSetPassword(invalid)).to.be.rejectedWith('Password must be a non-empty string');
      }
    });
  });
});
