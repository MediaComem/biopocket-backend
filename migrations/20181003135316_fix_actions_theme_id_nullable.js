/* eslint "require-jsdoc": ["off"] */

/**
 * This migration makes the `theme_id` column of the `actions` table not nullable.
 */
const { logMigration } = require('../utils/migrations');

exports.up = async function(knex) {
  logMigration(knex);

  await makeActionsThemeIdNotNullable(knex);
};

exports.down = async function(knex) {
  logMigration(knex);

  await makeActionsThemeIdNullable(knex);
};

function makeActionsThemeIdNotNullable(knex) {
  return knex.schema.alterTable('actions', t => {
    t.bigInteger('theme_id').notNullable().alter();
  });
}

function makeActionsThemeIdNullable(knex) {
  return knex.schema.alterTable('actions', t => {
    t.bigInteger('theme_id').nullable().alter();
  });
}
