const themeFixtures = require('../spec/fixtures/theme');
const { cleanDatabase, expect, expectTouchTimestamps, setUp } = require('../spec/utils');
const Action = require('./action');

setUp();

describe('Action model', () => {

  let theme;

  beforeEach(async () => {
    await cleanDatabase();
    theme = await themeFixtures.theme();
  });

  it('should be correctly created', async () => {
    const data = {
      title: 'Découvrir les prairies',
      description: 'Visiter une prairie fleurie «exemplaire» et s’informer sur l’écologie de ces milieux.',
      impact: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
      theme_id: theme.get('id')
    };

    const result = await new Action(data).save();

    expect(result).to.be.an.instanceOf(Action);

    expect(result.get('id'), 'action.id').to.be.a('string');
    expect(result.get('origin_id'), 'action.origin_id').to.equal(null);
    expect(result.get('api_id'), 'action.api_id').to.be.a('string');
    expect(result.get('title'), 'action.title').to.equal(data.title);
    expect(result.get('code'), 'action.code').to.equal(null);
    expect(result.get('description'), 'action.description').to.equal(data.description);
    expect(result.get('impact'), 'action.impact').to.equal(data.impact);
    expect(result.get('theme_id'), 'action.theme_id').to.equal(theme.get('id'));
    expectTouchTimestamps(result);

    expect(result.toJSON()).to.have.all.keys('id', 'origin_id', 'api_id', 'title', 'code', 'description', 'impact', 'theme_id', 'created_at', 'updated_at');
  });
});
