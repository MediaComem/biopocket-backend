# BioPocket Backend Development Guide

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->


- [Project structure](#project-structure)
  - [Server directory](#server-directory)
  - [API resource directory](#api-resource-directory)
- [Environments](#environments)
- [Scripts](#scripts)
  - [Development](#development)
  - [Database](#database)
  - [Documentation](#documentation)
  - [Testing](#testing)
  - [Utilities](#utilities)
- [Database](#database-1)
  - [Migrations](#migrations)
  - [ORM](#orm)
- [Logging](#logging)
- [Security](#security)
  - [Password storage](#password-storage)
  - [Authentication](#authentication)
  - [Authorization](#authorization)
  - [Policies](#policies)
    - [Serializing](#serializing)
- [Documentation](#documentation-1)
  - [API RAML documentation](#api-raml-documentation)
  - [Source code JSDoc documentation](#source-code-jsdoc-documentation)
- [Testing](#testing-1)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->



## Project structure

This is the overall project structure.

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
| `migrations`             | [Knex][knex] database migrations (see [Database](#database))                                            |
| `server`                 | Express server (API implementation with inline JSDoc, RAML documentation, automated tests)              |
| `scripts`                | Node.js utility scripts; used in some [Scripts](#scripts) below                                         |
| `utils`                  | Top-level utilities used in migrations and/or scripts                                                   |

### Server directory

This documents the contents of the `server` directory.

| File/Directory              | Contents                                                                                                                        |
| :---                        | :---                                                                                                                            |
| `server/api`                | API implementation                                                                                                              |
| `server/api/{subject}`      | Directory containing one or multiple related API resources (e.g. `server/api/auth` for the `/api/auth` authentication resource) |
| `server/api/index.js`       | API entrypoint which defines all top-level paths (e.g. `/api/auth`, `/api/users`) and generic error handling                    |
| `server/api/index.raml`     | API RAML documentation entrypoint which includes all other `.raml` files                                                        |
| `server/app.js`             | This file configures and exports the server's Express application                                                               |
| `server/db.js`              | This file exports an object that can be used to manage the application's database                                               |
| `server/models`             | [Bookshelf][bookshelf] database models                                                                                          |
| `server/models/abstract.js` | Abstract database model from which all other models should inherit                                                              |
| `server/spec`               | Automated test utilities                                                                                                        |
| `server/spec/expectations`  | Reusable expectations for automated tests                                                                                       |
| `server/spec/fixtures`      | Fixtures to generate data for automated tests                                                                                   |
| `server/spec/chai.js`       | [Chai][chai] assertion library configuration                                                                                    |
| `server/spec/utils.js`      | Other utility functions for automated tests                                                                                     |
| `server/start.js`           | This file exports a function that opens a connection to the database and starts the server                                      |
| `server/utils`              | Generic server utilities                                                                                                        |

### API resource directory

This documents the contents of one of the `server/api/{subject}` directory.

These files may be split if they become too large. For example, an
`.api.spec.js` file for automated tests can become quite large and may benefit
from being split into one file for each route for readability.

| File/Directory                    | Contents                                                                                            |
| :---                              | :---                                                                                                |
| `{subject}/{subject}.api.js`      | Route implementations and other middlewares related to the subject                                  |
| `{subject}/{subject}.api.spec.js` | Automated tests for the routes                                                                      |
| `{subject}/{subject}.policy.js`   | Default authorization policy for the subject's resources (handling access, parsing and serializing) |
| `{subject}/{subject}.routes.js`   | Express router and route definitions (including authentication and authorization)                   |
| `{subject}/{subject}.raml`        | API documentation for the routes                                                                    |
| `{subject}/{subject}.model.raml`  | API documentation for the main model/resource used in this subject                                  |



## Environments

TODO: document environments



## Scripts

Various npm scripts are available to facilite running the server in development,
test or production mode.

### Development

Useful scripts for day-to-day development.

| Script               | Purpose                                                                            |
| :---                 | :---                                                                               |
| `npm run dev`        | Run the server and open the project's documentation with live reload               |
| `npm run dev:docs`   | Generate the project's documentation and opens it in your browser with live reload |
| `npm run dev:server` | Run the server in development mode with live reload                                |
| `npm start`          | Run the server                                                                     |

### Database

See the [Database](#database) section for more information.

| Script                          | Purpose                                                                   |
| :---                            | :---                                                                      |
| `npm run migrate`               | Migrate the configured database to the latest version                     |
| `npm run migrate:make`          | Create a new migration (e.g. `npm run migrate:make -- my_migration_name`) |
| `npm run migrate:rollback`      | Roll back the previous migration batch                                    |
| `npm run migrate:test`          | Migrate the configured test database to the latest version                |
| `npm run migrate:test:rollback` | Roll back the previous migration batch on the test database               |
| `npm run sample-data`           | Generate sample data for development (see `scripts/sample-data.js`)       |

### Documentation

See the [Documentation](#documentation) section for more information.

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

See the [Testing](#testing) section for more information.

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



## Database

The server requires a PostgreSQL 9.6+ database with the following extensions
enabled:

* `postgis` to store geographic information.
* `uuid-ossp` to generate UUIDs as API identifiers.

### Migrations

Database migration scripts are written in JavaScript in the `migrations`
directory. Read the documentation on [Knex migrations][knex-migrations] for more
information.

### ORM

TODO: document bookshelf usage



## Logging

TODO: document logging with log4js



## Security

The main security features of this server are:

* User account passwords are stored as a [bcrypt][bcrypt] hash.
* API authentication and authorization is implemented using the
  [express-jwt-policies][express-jwt-policies] library which works with
  [JWT][jwt] tokens and user-provided policy functions.

  The configuration of the library can be found in `server/api/utils/auth.js`.

### Password hashing

The [bcryptjs][bcryptjs library] is used to compute the bcrypt hashes.

The bcrypt cost factor can be adjusted when launching the server by providing
the `$BCRYPT_COST` environment variable or setting the `bcryptCost`
configuration property (see [Configuration](README.md#configuration)).

### Authentication

To authenticate to some API resources, the user must send an `Authorization`
header with a bearer JWT token (i.e. `Bearer TOKEN`). If the token is missing,
malformed, invalid or has expired, the response's status code will be 401
Unauthorized with a JSON error identifying the problem.

### Authorization

BioPocket users can have a number of roles, such as `admin`. A standard user has
no roles. Some API resources require the user to have specific roles in addition
to being authenticated.

If the user does not have sufficient privileges, the response's status code will
be 403 Forbidden. In some cases, the status code can also be 404 Not Found (e.g.
if a user is trying to access a resource that exists but to which he does not
have access).

### Policies

The logic allowing the API to know if a request to a given request is authorized
is encapsulated into a **policy function**. You may find such a function in a
`.policy.js` files in an API subject's directory, for example
`server/api/users/users.policy.js`:

```js
const { hasRole, sameRecord } = require('../utils/policy');

exports.canRetrieve = function(req) {
  return hasRole(req, 'admin') || sameRecord(req.currentUser, req.user);
};
```

This function checks whether the authenticated user (`req.currentUser`) can
retrieve a user resource (`req.user`):

* In this case, you are authorized to retrieve a user if you have the `admin`
  role or if you are authenticated as the user you are trying to retrieve.
* You are **not** authorized, for example, to retrieve another user (unless you
  have the `admin` role).

**All route access logic should be encapsulated in similar policy functions.**

Policy functions may return a promise. Various authorization utilities are
available in `server/api/utils/policy`.

#### Serializing

Policies should handle the serialization of database records into response
bodies, because some properties might only be visible by users with specific
roles.

Policies should have a `serialize(req, resource)` function, with the first
argument being an Express request object (used to determine the authenticated
user and roles), and the second being the resource to serialize.

For example:

```js
const { ensureRequest } = require('../../utils/express');

exports.serialize = function(req, user) {
  ensureRequest(req);

  // Anyone can see the e-mail.
  const serialized = {
    email: user.get('email')
  };

  // Only an admin user can see the login count.
  const admin = req.currentUser && req.currentUser.hasRole('admin');
  if (admin) {
    serialized.loginCount = user.get('login_count');
  }

  return serialized;
}
```



## Validation

TODO: documentation validation with valdsl



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



## Testing

The server has an automated test suite developed using the following tools:

* [Mocha][mocha] - JavaScript test framework
  * [enrich-api-error][enrich-api-error] - Test utility to enrich API error
    stack traces.
  * [mocha-api-errors][mocha-api-errors] - Mocha reporter with more detailed
    stack traces for API errors
* [Chai][chai] - BDD/TDD assertion library
  * [chai-iso8601][chai-iso8601] - Chai matcher for ISO-8601 date strings
  * [chai-moment][chai-moment] - Chai matchers for dates
  * [chai-objects][chai-objects] - Chai matcher for object arrays
* [Chance][chance] - Minimalist generator of random strings, numbers, etc.
* [SuperTest][supertest] - Super-agent driven library for testing Node.js HTTP
  servers using a fluent API
  * [SuperREST][superrest] - SuperTest helpers to test REST APIs
* [test-value-generator][test-value-generator] - Utility to generate incremental
  and unique values in automated tests

Additionally, the following tools are used to generate code coverage reports:

* [babel-plugin-istanbul][babel-plugin-istanbul] - A babel plugin that adds
  istanbul instrumentation to ES6 code
* [babel-require][babel-require] - This require hook will bind itself to Node's
  require and automatically compile files on the fly
* [coveralls-node][coveralls-node] - Send test coverage to
  [Coveralls][coveralls]
* [nyc][nyc] - [Istanbul][istanbul] code coverage command line interface



[babel-plugin-istanbul]: https://github.com/istanbuljs/babel-plugin-istanbul
[babel-require]: https://www.npmjs.com/package/babel-register
[bcrypt]: https://en.wikipedia.org/wiki/Bcrypt
[bcryptjs]: https://www.npmjs.com/package/bcryptjs
[bookshelf]: http://bookshelfjs.org
[chai]: http://chaijs.com
[chai-iso8601]: https://github.com/MediaComem/chai-iso8601
[chai-moment]: https://www.npmjs.com/package/chai-moment
[chai-objects]: https://github.com/MediaComem/chai-objects
[chance]: http://chancejs.com
[coveralls]: https://coveralls.io
[coveralls-node]: https://www.npmjs.com/package/coveralls
[enrich-api-error]: https://github.com/MediaComem/enrich-api-error
[express-jwt-policies]: https://github.com/MediaComem/express-jwt-policies#readme
[istanbul]: https://istanbul.js.org
[jsdoc]: http://usejsdoc.org
[jwt]: https://jwt.io
[knex]: http://knexjs.org
[knex-migrations]: http://knexjs.org/#Migrations
[mocha]: https://mochajs.org
[mocha-api-errors]: https://github.com/MediaComem/mocha-api-errors
[nyc]: https://github.com/istanbuljs/nyc
[raml]: https://raml.org
[raml-spec]: https://github.com/raml-org/raml-spec/blob/master/versions/raml-10/raml-10.md
[raml-traits]: https://github.com/raml-org/raml-spec/blob/master/versions/raml-10/raml-10.md#resource-types-and-traits
[superrest]: https://github.com/MediaComem/superrest
[supertest]: https://github.com/visionmedia/supertest
[test-value-generator]: https://github.com/MediaComem/test-value-generator
[yaml]: http://yaml.org
