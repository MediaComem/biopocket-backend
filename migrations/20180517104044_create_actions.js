/* eslint "require-jsdoc": ["off"] */
const { addTouchColumnsOn, logMigration } = require('../utils/migrations');

exports.up = async function(knex) {
  logMigration(knex);

  await createActions(knex);
};

exports.down = async function(knex) {
  logMigration(knex);

  await dropActions(knex);
};

function createActions(knex) {
  return knex.schema.createTable('actions', t => {
    t.bigIncrements('id').primary();
    t.bigInteger('origin_id').unique();
    t.specificType('api_id', 'uuid').unique().notNullable().defaultTo(knex.raw('uuid_generate_v4()'));
    t.string('title', 40).notNullable();
    t.string('code', 10);
    t.string('description', 255).notNullable();
    // Foreign keys
    t.bigInteger('theme_id').references('id').inTable('themes');
    // Time stamps
    addTouchColumnsOn(t);
  });
}

function dropActions(knex) {
  return knex.schema.dropTable('actions');
}
