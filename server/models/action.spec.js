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
      theme_id: theme.get('id')
    };

    const result = await new Action(data).save();

    expect(result).to.be.an.instanceOf(Action);

    expect(result.get('id'), 'article.id').to.be.a('string');
    expect(result.get('origin_id'), 'article.origin_id').to.equal(null);
    expect(result.get('api_id'), 'article.api_id').to.be.a('string');
    expect(result.get('title'), 'article.title').to.equal(data.title);
    expect(result.get('code'), 'article.code').to.equal(null);
    expect(result.get('description'), 'article.description').to.equal(data.description);
    expect(result.get('theme_id'), 'article.theme_id').to.equal(theme.get('id'));
    expectTouchTimestamps(result);

    expect(result.toJSON()).to.have.all.keys('id', 'origin_id', 'api_id', 'title', 'code', 'description', 'theme_id', 'created_at', 'updated_at');
  });
});
