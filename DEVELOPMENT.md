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



[coveralls]: https://coveralls.io
