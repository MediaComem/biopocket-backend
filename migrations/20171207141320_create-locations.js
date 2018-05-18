/* eslint "require-jsdoc": ["off"] */
const { logMigration } = require('../utils/migrations');

exports.up = async function(knex) {
  logMigration(knex);

  await createLocations(knex);
};

exports.down = async function(knex) {
  logMigration(knex);

  await dropLocations(knex);
};

function createLocations(knex) {
  return knex.schema.createTable('locations', t => {
    t.bigIncrements('id').primary();
    t.specificType('api_id', 'uuid').notNullable().defaultTo(knex.raw('uuid_generate_v4()'));
    t.string('name', 150).notNullable();
    t.string('short_name', 30);
    t.string('address_street', 150).notNullable();
    // An adress could only be the name of street. This is the case with the "lieux-dits", for example.
    t.string('address_number', 10);
    t.string('address_zip_code', 15).notNullable();
    t.string('address_city', 100).notNullable();
    t.string('address_state', 30).notNullable();
    t.text('description').notNullable();
    t.string('photo_url', 500).notNullable();
    t.string('site_url', 500).notNullable();
    t.string('phone', 20).notNullable();
    t.specificType('geometry', 'point').notNullable();
    t.json('properties').notNullable().defaultTo('{}');
    t.timestamp('created_at', true).notNullable().defaultTo(knex.raw('now()'));
    t.timestamp('updated_at', true).notNullable().defaultTo(knex.raw('now()'));

    t.index('created_at');
    t.index('updated_at');
    t.unique('api_id');
  });
}

function dropLocations(knex) {
  return knex.schema.dropTable('locations');
}
