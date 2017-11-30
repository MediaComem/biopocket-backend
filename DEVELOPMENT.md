# BioPocket Backend Development Guide

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->


- [Scripts](#scripts)
  - [Development](#development)
  - [Database](#database)
  - [Documentation](#documentation)
  - [Testing](#testing)
  - [Utilities](#utilities)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->



## Project structure

| File/Directory           | Contents                                                                                                |
| :---                     | :---                                                                                                    |
| `bin/www`                | Server launch script                                                                                    |
| `config/index.js`        | Configuration used by the server                                                                        |
| `config/local.js`        | Optional local configuration file that is automatically loaded by `config/index.js`                     |
| `config/local.sample.js` | Sample local configuration file; copy it to `config/local.js` and edit                                  |
| `coverage`               | Test coverage report (created after running automated tests)                                            |
| `docs`                   | Project documentation (generate all documentation with `npm run docs` or `npm run dev`)                 |
| `docs/api`               | API documentation (created after running `npm run docs:api`, `npm run docs` or `npm run dev`)           |
| `docs/index.html`        | Home page of the project's documentation (with links to GitHub and the API & source code documentation) |
| `docs/src`               | Source code documentation (created after running `npm run docs:src`, `npm run docs` or `npm run dev`)   |
| `migrations`             | [Knex][knex] database migrations                                                                        |
| `server`                 | Express server (API implementation with inline JSDoc, RAML documentation, automated tests)              |
| `scripts`                | Node.js utility scripts; used in some [Scripts](#scripts) below                                         |
| `utils`                  | Top-level utilities used in migrations and/or scripts                                                   |

### Server directory

| File/Directory              | Contents                                                                                                             |
| :---                        | :---                                                                                                                 |
| `server/api`                | API implementation                                                                                                   |
| `server/api/{resource}`     | Directory containing the implementation for an API resource(s) (e.g. `server/api/auth` for the `/api/auth` resource) |
| `server/api/index.js`       | API entrypoint which defines all top-level paths (e.g. `/api/auth`, `/api/users`) and generic error handling         |
| `server/api/index.raml`     | API RAML documentation entrypoint which includes all other `.raml` files                                             |
| `server/app.js`             | This file configures and exports the server's Express application                                                    |
| `server/db.js`              | This file exports an object that can be used to manage the application's database                                    |
| `server/models`             | [Bookshelf][bookshelf] database models                                                                               |
| `server/models/abstract.js` | Abstract database model from which all other models should inherit                                                   |
| `server/spec`               | Automated test utilities                                                                                             |
| `server/spec/expectations`  | Reusable expectations for automated tests                                                                            |
| `server/spec/fixtures`      | Fixtures to generate data for automated tests                                                                        |
| `server/spec/chai.js`       | [Chai][chai] assertion library configuration                                                                         |
| `server/spec/utils.js`      | Other utility functions for automated tests                                                                          |
| `server/start.js`           | This file exports a function that opens a connection to the database and starts the server                           |
| `server/utils`              | Generic server utilities                                                                                             |



## Documentation

The `README.md` file documents basic setup instructions and how to configure the
server. This `DEVELOPMENT.md` file explains how the server is developed.

Guidelines:

* **Always keep the README up-to-date.**
* When adding a new library or mechanism, document it in this `DEVELOPMENT.md`
  file if appropriate.

### API RAML documentation

The API is documented with [RAML][raml], a [YAML][yaml]-based language to describe REST APIs.

The `server/api/index.raml` file is the entrypoint for that documentation. It
includes other `.raml` files describing each resource under the `server/api`
directory (e.g. `server/api/auth/auth.raml`) to form the documentation for the
entire API.

You can generate this documentation by running `npm run docs:api` and will find
the results in the `docs/api` directory. It is also generated and served in your
browser automatically when running `npm run dev`.

Guidelines:

* **Always update the RAML documentation when making changes to the API.**
* Use the [RAML specification][raml-spec] as a reference.
* Try to isolate repeated resource properties as [traits][raml-traits]

### Source code JSDoc documentation

Some of the source code is documented inline with [JSDoc][jsdoc].

You can generate this documentation by running `npm run docs:src` and will find
the results in the `docs/src` directory. It is also generated and served in your
browser automatically when running `npm run dev`.

Guidelines:

* **Always update an existing function's JSDoc when modifying its inputs,
  outputs or behavior.**
* Document all reusable & utility functions (include an **example** if possible).
* Document all database models:
  * Columns
  * Extra methods
  * Virtual properties



## Scripts

### Development

| Script               | Purpose                                                                            |
| :---                 | :---                                                                               |
| `npm run dev`        | Run the server and open the project's documentation with live reload               |
| `npm run dev:docs`   | Generate the project's documentation and opens it in your browser with live reload |
| `npm run dev:server` | Run the server in development mode with live reload                                |
| `npm start`          | Run the server                                                                     |

### Database

| Script                          | Purpose                                                                   |
| :---                            | :---                                                                      |
| `npm run migrate`               | Migrate the configured database to the latest version                     |
| `npm run migrate:make`          | Create a new migration (e.g. `npm run migrate:make -- my_migration_name`) |
| `npm run migrate:rollback`      | Roll back the previous migration batch                                    |
| `npm run migrate:test`          | Migrate the configured test database to the latest version                |
| `npm run migrate:test:rollback` | Roll back the previous migration batch on the test database               |
| `npm run sample-data`           | Generate sample data for development (see `scripts/sample-data.js`)       |

### Documentation

| Script                   | Purpose                                                                                       |
| :---                     | :---                                                                                          |
| `npm run docs`           | Generate the project's documentation                                                          |
| `npm run docs:api`       | Generate the project's API documentation                                                      |
| `npm run docs:api:clean` | Delete the project's API documentation                                                        |
| `npm run docs:api:watch` | Watch the project's API documentation to automatically re-generate it when it changes         |
| `npm run docs:clean`     | Delete the project's documentation                                                            |
| `npm run docs:serve`     | Open the project's documentation in your browser with live reload                             |
| `npm run docs:src`       | Generate the project's source code documentation                                              |
| `npm run docs:src:clean` | Delete the project's source code documentation                                                |
| `npm run docs:src:watch` | Watch the project's source code documentation to automatically re-generate it when it changes |
| `npm run docs:watch`     | Watch the project's documentation to automatically re-generate it when it changes             |

### Testing

| Script                   | Purpose                                                                                        |
| :---                     | :---                                                                                           |
| `npm test`               | Run all automated tests                                                                        |
| `npm run test:coveralls` | Send test coverage data to [Coveralls][coveralls] (used on Travis CI)                          |
| `npm run test:debug`     | Run all automated tests with `$LOG_LEVEL` set to `TRACE` (all database queries will be logged) |

### Utilities

| Script                 | Purpose                                                                                                       |
| :---                   | :---                                                                                                          |
| `npm run anonymize`    | Anonymize the database (see `scripts/anonymize.js`)                                                           |
| `npm run create-admin` | Create an admin user; requires `$ADMIN_EMAIL` and `$ADMIN_PASSWORD` to be set (see `scripts/create-admin.js`) |
| `npm run doctoc`       | Update the table of contents in `README.md` and `DEVELOPMENT.md`                                              |



[bookshelf]: http://bookshelfjs.org
[chai]: http://chaijs.com
[coveralls]: https://coveralls.io
[jsdoc]: http://usejsdoc.org
[knex]: http://knexjs.org
[raml]: https://raml.org
[raml-spec]: https://github.com/raml-org/raml-spec/blob/master/versions/raml-10/raml-10.md
[raml-traits]: https://github.com/raml-org/raml-spec/blob/master/versions/raml-10/raml-10.md#resource-types-and-traits
[yaml]: http://yaml.org
