const { logMigration, addTouchColumnsOn } = require('../utils/migrations');

exports.up = async function(knex) {
  logMigration(knex);

  await createThemes(knex);
};

exports.down = async function(knex) {
  logMigration(knex);

  await dropThemes(knex);
};

function createThemes(knex) {
  return knex.schema.createTable('themes', t => {
    t.bigIncrements('id').primary();
    t.bigInteger('origin_id').unique();
    t.specificType('api_id', 'uuid').unique().notNullable().defaultTo(knex.raw('uuid_generate_v4()'));
    t.string('title', 40).notNullable();
    t.string('code', 5);
    t.text('description').notNullable();
    t.string('photo_url', 500);
    t.text('source');
    // Timestamp columns
    addTouchColumnsOn(t);
  });
}

function dropThemes(knex) {
  return knex.schema.dropTable('themes');
}
