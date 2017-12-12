/**
 * This migration transforms the `geometry` column of the `locations` table
 * into a PostGIS geometry column rather than a PostgreSQL point column.
 *
 * WARNING: all locations are deleted before the operation.
 */
const { logMigration } = require('../utils/migrations');

exports.up = async function(knex) {
  logMigration(knex);
  await fixLocationsGeometry(knex);
};

exports.down = async function(knex) {
  logMigration(knex);
  await unfixLocationsGeometry(knex);
};

async function fixLocationsGeometry(knex) {

  await knex.delete().from('locations');

  await knex.schema.alterTable('locations', t => {
    t.specificType('geometry', 'geometry(POINT, 4326)').notNullable().alter();
  });
}

async function unfixLocationsGeometry(knex) {

  await knex.delete().from('locations');

  await knex.schema.alterTable('locations', t => {
    t.specificType('geometry', 'point').notNullable().alter();
  });
}
