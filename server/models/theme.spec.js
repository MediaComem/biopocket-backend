const { expect, setUp, cleanDatabase, expectTouchTimestamps } = require('../spec/utils');
const Theme = require('./theme');

setUp();

describe('Theme model', () => {

  beforeEach(async () => {
    await cleanDatabase();
  });

  it("should be correctly created", async () => {
    const data = {
      title: "Prairies et gazon fleuris",
      description: `
        Les prairies fleuries sont des milieux potentiellement très riches en biodiversité, composées d’un grand nombre d’espèces végétales (jusqu’à plus de 60 espèces / are). Elles constituent également des habitats pour la petite faune et des lieux de nourrissage (insectes, oiseaux, mammifères). En ce qui concerne l’entretien, les gazons fleuris et prairies fleuries permettent des économies de moyens (arrosage, engrais, produits phytosanitaires, fréquence d’entretien,…) par rapport à un gazon conventionnel.
      `,
      photo_url: "http://example.com/prairies_fleuries.jpg"
    };

    const result = await new Theme(data).save();

    expect(result).to.be.an.instanceOf(Theme);

    expect(result.get('id'), 'theme.id').to.be.a('string');
    expect(result.get('api_id'), 'theme.api_id').to.be.a('string');
    expect(result.get('origin_id'), 'theme.origin_id').to.be.null;
    expect(result.get('title'), 'theme.title').to.be.equal(data.title);
    expect(result.get('code'), 'theme.code').to.be.null;
    expect(result.get('description'), 'theme.description').to.be.equal(data.description);
    expect(result.get('photo_url'), 'theme.photo_url').to.be.equal(data.photo_url);
    expect(result.get('source'), 'theme.source').to.be.null;
    expectTouchTimestamps(result);

    expect(result.toJSON()).to.have.all.keys('id', 'origin_id', 'api_id', 'title', 'code', 'description', 'photo_url', 'source', 'created_at', 'updated_at');
  });
});