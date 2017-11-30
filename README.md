# BioPocket Backend

The API for the BioPocket project, implemented with a Node.js Express server.

[![Dependency Status](https://gemnasium.com/badges/github.com/MediaComem/biopocket-backend.svg)](https://gemnasium.com/github.com/MediaComem/biopocket-backend)

[![Build Status](https://travis-ci.org/MediaComem/biopocket-backend.svg?branch=master)](https://travis-ci.org/MediaComem/biopocket-backend)
[![Coverage Status](https://coveralls.io/repos/github/MediaComem/biopocket-backend/badge.svg?branch=master)](https://coveralls.io/github/MediaComem/biopocket-backend?branch=master)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE.txt)

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->


- [Requirements](#requirements)
- [Development](#development)
  - [First-time setup](#first-time-setup)
  - [Run the server](#run-the-server)
  - [Upgrade to the latest version](#upgrade-to-the-latest-version)
  - [Contribute](#contribute)
- [Configuration](#configuration)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->



## Requirements

* [Node.js][node] 8.x
* [PostgreSQL][postgresql] 9+
  * [PostGIS][postgis] 2.2+ extension
  * [uuid-ossp][uuid-ossp] extension

Optional development utilities:

* [Knex][knex] (install with `npm install -g knex`)



## Development

How to set up your machine to contribute to the project.

### First-time setup

* Clone this repository:

      git clone https://github.com/MediaComem/biopocket-backend.git

* Install the application's dependencies:

      cd biopocket-backend
      npm install

* Create a `config/local.js` configuration file to customize the database
  connection URL and other properties (see [Configuration][config]):

      cp config/local.sample.js config/local.js

* Create a PostgreSQL database consistent with your configuration (a `biopocket`
  database on `localhost` by default). If the user you connect as does not have
  the necessary privileges to create extensions, you should make sure that the
  `postgis` and `uuid-ossp` extensions are already created in the database:

      psql -c 'CREATE EXTENSION "postgis"; CREATE EXTENSION "uuid-ossp";' biopocket

* Migrate the database:

      npm run migrate

* Generate sample data:

      npm run sample-data

### Run the server

* Run the `dev` npm script:

      npm run dev

### Upgrade to the latest version

* Update your branch (and resolve any conflicts):

      git pull

* Install new application dependencies (if any):

      npm install

* Migrate the database (if new migrations were added):

      npm run migrate

* Run the server:

      npm run dev

### Contribute

Read the [development guide][dev-guide].



## Configuration

The application can be configured through environment variables or a configuration file.
Environment variables always take precedence over properties from the
configuration file.

| Environment variable | Config property | Default                          | Purpose                                                                       |
| :---                 | :---            | :---                             | :---                                                                          |
| `$BCRYPT_COST`       | `bcryptCost`    | 10                               | bcrypt cost parameter (should be at least 10; see [bcrypt][bcrypt])           |
| `$CONFIG`            |                 | `config/local.js`                | Path to the local configuration file to load                                  |
| `$CORS`              | `cors`          | `false`                          | Whether to enable Cross-Origin Request Sharing (CORS)                         |
| `$DATABASE_URL`      | `db`            | `postgres://localhost/biopocket` | PostgreSQL database URL to connect to                                         |
| `$LOG_LEVEL`         | `logLevel`      | `INFO`                           | Log level (`TRACE`, `DEBUG`, `INFO`, `WARN`, `ERROR`, `FATAL`)                |
| `$NODE_ENV`          | `env`           | `development`                    | Application environment (`development` or `production`)                       |
| `$PORT`              | `port`          | `3000`                           | Port to run the Node.js Express server on                                     |
| `$SESSION_SECRET`    | `sessionSecret` |                                  | Session secret used to sign JWT tokens (a long random string, e.g. 100 chars) |

If the database URL is not specified with `$DATABASE_URL` or `db`, you can use these environment variables instead:

| Environment variable | Default     | Purpose                                   |
| :---                 | :---        | :---                                      |
| `$DATABASE_HOST`     | `localhost` | Host to connect to                        |
| `$DATABASE_PORT`     | `5432`      | Port to connect to on the host            |
| `$DATABASE_NAME`     | `biopocket` | Name of the database to connect to        |
| `$DATABASE_USERNAME` | none        | Name of the PostgreSQL user to connect as |
| `$DATABASE_PASSWORD` | none        | Password to authenticate with             |

The following properties can be used in development to customize how the project's documentation is served locally:

| Environment variable | Config property | Default     | Purpose                                                                                                           |
| :---                 | :---            | :---        | :---                                                                                                              |
| `$DOCS_BROWSER`      | `docs.browser`  |             | Browser to open                                                                                                   |
| `$DOCS_HOST`         | `docs.host`     | `127.0.0.1` | Host to serve the documentation on                                                                                |
| `$DOCS_OPEN`         | `docs.open`     | `false`     | Whether to automatically open the browser with the documentation when running `npm run dev` or `npm run dev:docs` |
| `$DOCS_PORT`         | `docs.port`     |             | Port to serve the documentation on (a free random port will be found by default)                                  |



[bcrypt]: https://en.wikipedia.org/wiki/Bcrypt
[config]: #configuration
[dev-guide]: DEVELOPMENT.md
[knex]: http://knexjs.org
[node]: https://nodejs.org
[postgis]: http://postgis.net
[postgresql]: https://www.postgresql.org
[uuid-ossp]: https://www.postgresql.org/docs/current/static/uuid-ossp.html
