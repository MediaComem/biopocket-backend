/* eslint "require-jsdoc": ["off"] */

/**
 * This migration adds the `impact` column to the `actions` table, describing
 * the impact of the action on biodiversity.
 */
const { logMigration } = require('../utils/migrations');

exports.up = async function(knex) {
  logMigration(knex);
  await addActionsImpact(knex);
};

exports.down = async function(knex) {
  logMigration(knex);
  await dropActionsImpact(knex);
};

async function addActionsImpact(knex) {

  await knex.schema.alterTable('actions', t => {
    t.text('impact');
  });

  // Fill the column with "N/A" for now.  Run "npm run sync" to synchronize the
  // data from the data collection interface.
  await knex('actions').update({ impact: 'N/A' });

  await knex.schema.alterTable('actions', t => {
    t.text('impact').notNullable().alter();
  });
}

function dropActionsImpact(knex) {
  return knex.schema.alterTable('actions', t => {
    t.dropColumn('impact');
  });
}
