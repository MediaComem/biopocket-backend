/**
 * This migration removes the default constraints on both the
 * `created_at` and `updated_at` columns of the `locations` table.
 * They are not necessary since `bookshelf-touch` will handle those columns.
 */
const { logMigration } = require('../utils/migrations');

exports.up = async function(knex) {
  logMigration(knex);

  await fixTimestampsConstraints(knex);
};

exports.down = async function(knex) {
  logMigration(knex);

  await unfixTimestampsConstraints(knex);
};

function fixTimestampsConstraints(knex) {
  return knex.schema.alterTable('locations', t => {
    t.timestamp('created_at', true).notNullable().alter();
    t.timestamp('updated_at', true).notNullable().alter();
  });
}

function unfixTimestampsConstraints(knex) {
  return knex.schema.alterTable('locations', t => {
    t.timestamp('created_at', true).notNullable().defaultTo(knex.raw('now()')).alter();
    t.timestamp('updated_at', true).notNullable().defaultTo(knex.raw('now()')).alter();
  });
}