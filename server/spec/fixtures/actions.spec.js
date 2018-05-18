const Theme = require('../../models/theme');
const { expect } = require('../utils');
const actionFixtures = require('./actions');
const themeFixtures = require('./theme');

describe('Actions fixtures', () => {
  describe('action function', () => {
    it('should create an action related to a new theme', async function() {
      const action = await actionFixtures.action();
      const theme = await new Theme({ id: action.get('theme_id') }).fetch();

      expect(theme).not.to.be.equal(null);
      expect(theme).to.be.an.instanceOf(Theme);
    });

    it('should create an action related to the given theme', async function() {
      const theme = await themeFixtures.theme();
      const action = await actionFixtures.action({ theme: theme });

      expect(action.get('theme_id')).to.equal(theme.get('id'));
    });
  });
});
