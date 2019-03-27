/* eslint "require-jsdoc": ["off"] */

/**
 * This migration removes the `photo_url` column from the `themes` table.
 */
const { logMigration } = require('../utils/migrations');

exports.up = async function(knex) {
  logMigration(knex);
  await dropThemesPhotoUrl(knex);
};

exports.down = async function(knex) {
  logMigration(knex);
  await addThemesPhotoUrl(knex);
};

function dropThemesPhotoUrl(knex) {
  return knex.schema.alterTable('themes', t => {
    t.dropColumn('photo_url');
  });
}

function addThemesPhotoUrl(knex) {
  return knex.schema.alterTable('themes', t => {
    t.string('photo_url', 500);
  });
}
