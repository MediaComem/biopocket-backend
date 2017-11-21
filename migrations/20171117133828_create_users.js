const { logMigration } = require('../utils/migrations');

exports.up = function(knex) {
  logMigration(knex);

  return Promise
    .resolve()
    .then(() => createExtensions(knex))
    .then(() => createUsers(knex));
};

exports.down = function(knex) {
  logMigration(knex);

  return Promise
    .resolve()
    .then(() => dropUsers(knex))
    .then(() => dropExtensions(knex));
};

function createExtensions(knex) {
  return Promise.all([
    knex.raw('CREATE EXTENSION IF NOT EXISTS "postgis"'),
    knex.raw('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"')
  ]);
}

function createUsers(knex) {
  return knex.schema.createTable('users', (t) => {

    t.bigIncrements('id').primary();
    t.specificType('api_id', 'uuid').notNullable().defaultTo(knex.raw('uuid_generate_v4()'));
    t.string('email', 255).notNullable();
    t.string('password_hash', 60); // 60 is the length of a bcrypt hash.
    t.boolean('active').notNullable().defaultTo(false);
    t.specificType('roles', 'varchar(20)[]').notNullable().defaultTo('{}');
    t.timestamp('created_at', true).notNullable();
    t.timestamp('updated_at', true).notNullable();

    t.index('created_at');
    t.index('updated_at');
    t.unique('api_id');
  })
    .raw('CREATE UNIQUE INDEX users_email_unique ON users (LOWER(email));');
}

function dropExtensions(knex) {
  return Promise.all([
    knex.raw('DROP EXTENSION "postgis"'),
    knex.raw('DROP EXTENSION "uuid-ossp"')
  ]);
}

function dropUsers(knex) {
  return knex.schema.dropTable('users');
}
