# BioPocket Backend

The API for the BioPocket project, implemented with a Node.js Express server.



## Requirements

* [Node.js](https://nodejs.org) 8.x
* [PostgreSQL](https://www.postgresql.org) 9+
* [PostGIS](http://postgis.net) 2.2+

Additional development requirements:

* [Knex](http://knexjs.org) (install with `npm install -g knex`)



## Development

How to set up your machine to contribute to the project.

### First-time setup

* Clone this repository:

      git clone https://github.com/MediaComem/biopocket-backend.git

* Install the application's dependencies:

      cd biopocket-backend
      npm install

### Run the server

* Run the `dev` npm script:

      npm run dev

### Upgrade to the latest version

* Update your branch (and resolve any conflicts):

      git pull

* Install new application dependencies (if any):

      npm install

* Run the server:

      npm run dev

### Scripts

| Script           | Purpose                                               |
| :---             | :---                                                  |
| `npm run dev`    | Run the server in development mode (with live reload) |
| `npm start`      | Run the server                                        |
