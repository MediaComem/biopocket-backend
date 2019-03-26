/* eslint "require-jsdoc": ["off"] */
const { addTouchColumnsOn, logMigration } = require('../utils/migrations');

exports.up = async function(knex) {
  logMigration(knex);

  await createRegistrations(knex);
};

exports.down = async function(knex) {
  logMigration(knex);

  await dropRegistrations(knex);
};

function createRegistrations(knex) {
  return knex.schema.createTable('registrations', t => {
    t.bigIncrements('id').primary();
    t.specificType('api_id', 'uuid').unique().notNullable().defaultTo(knex.raw('uuid_generate_v4()'));
    t.string('firstname', 255).notNullable();
    t.string('lastname', 255).notNullable();
    t.string('email', 255).notNullable();
    addTouchColumnsOn(t);
  })
    .raw('CREATE UNIQUE INDEX registrations_email_unique ON registrations (LOWER(email));');
}

function dropRegistrations(knex) {
  return knex.schema.dropTable('registrations');
}
