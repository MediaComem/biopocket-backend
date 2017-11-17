# BioPocket Backend

The API for the BioPocket project, implemented with a Node.js Express server.



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

* Optionally create a `config/local.js` configuration file to customize the
  database connection URL or other properties (see [Configuration][config]):

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

| Environment variable | Config property | Default                          | Purpose                                                                               |
| :---                 | :---            | :---                             | :---                                                                                  |
| `$BCRYPT_COST`       | `bcryptCost`    | 10                               | bcrypt cost parameter; should be at least 10 (see [bcrypt][bcrypt])                   |
| `$CONFIG`            |                 | `config/local.js`                | Path to the local configuration file to load                                          |
| `$CORS`              | `cors`          | `false`                          | Whether to enable Cross-Origin Request Sharing (CORS)                                 |
| `$DATABASE_URL`      | `db`            | `postgres://localhost/biopocket` | PostgreSQL database URL to connect to (postgres://username:password@host:port/dbname) |
| `$LOG_LEVEL`         | `logLevel`      | `INFO`                           | Log level (`TRACE`, `DEBUG`, `INFO`, `WARN`, `ERROR`, `FATAL`)                        |
| `$NODE_ENV`          | `env`           | `development`                    | Application environment (`development` or `production`)                               |
| `$PORT`              | `port`          | `3000`                           | Port to run the Node.js Express server on                                             |

If the database URL is not specified with `$DATABASE_URL` or `db` in a configuration file, you can also use these environment variables:

| Environment variable | Default     | Purpose                                   |
| `$DATABASE_HOST`     | `localhost` | Host to connect to                        |
| `$DATABASE_PORT`     | `5432`      | Port to connect to on the host            |
| `$DATABASE_NAME`     | `biopocket` | Name of the database to connect to        |
| `$DATABASE_USERNAME` | none        | Name of the PostgreSQL user to connect as |
| `$DATABASE_PASSWORD` | none        | Password to authenticate with             |



[bcrypt]: https://en.wikipedia.org/wiki/Bcrypt
[config]: #configuration
[dev-guide]: DEVELOPMENT.md
[knex]: http://knexjs.org
[node]: https://nodejs.org
[postgis]: http://postgis.net
[postgresql]: https://www.postgresql.org
[uuid-ossp]: https://www.postgresql.org/docs/current/static/uuid-ossp.html
