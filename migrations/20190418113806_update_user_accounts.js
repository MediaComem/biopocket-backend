const { logMigration } = require('../utils/migrations');

/**
 * Adds columns to manage user accounts (name, email verification status,
 * registration status, audit).
 *
 * The email is also made optional because in the future, we may not be able to
 * retrieve the email of social accounts (e.g. Google/Facebook). The provider ID
 * is required instead.
 *
 * @param {Knex} knex - Knex instance.
 */
exports.up = async function(knex) {
  logMigration(knex);

  await knex.schema.alterTable('users', t => {
    t.string('first_name', 30).notNullable();
    t.string('last_name', 30).notNullable();
    t.string('email', 255).nullable().alter();
    t.boolean('email_verified').notNullable().defaultTo(false);
    t.timestamp('email_verified_at', true);
    // Knex enumerations are implemented with a PostgreSQL constraint by
    // default, not an actual ENUM. This should not be a problem as we should
    // not need to list or manipulate the list of providers (it is hardcoded).
    t.enu('provider', [ 'local' ]).notNullable();
    t.string('provider_id', 255).notNullable();
    t.json('provider_data');
    t.unique([ 'provider', 'provider_id' ]);
    t.string('registration_otp', 10);
    t.timestamp('registration_otp_created_at', true);
    t.bigInteger('updated_by').references('id').inTable('users');
  });
};

/**
 * Rolls back the migration.
 *
 * Note that it will fail if users without emails are added in the future (e.g.
 * Facebook users whose emails we cannot access).
 *
 * @param {Knex} knex - Knex instance.
 */
exports.down = async function(knex) {
  logMigration(knex);

  await knex.schema.alterTable('users', t => {
    t.string('email', 255).notNullable().alter();
    t.dropColumns(
      'first_name', 'last_name',
      'email_verified', 'email_verified_at',
      'provider', 'provider_id', 'provider_data',
      'registration_otp', 'registration_otp_created_at',
      'updated_by'
    );
  });
};
