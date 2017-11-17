# BioPocket Backend Development Guide

## npm scripts

| Script                     | Purpose                                                              |
| :---                       | :---                                                                 |
| `npm run dev`              | Run the server in development mode (with live reload)                |
| `npm run migrate`          | Migrate the configured database to the latest version                |
| `npm run migrate:make`     | Create a new migration (e.g. `npm run migrate:make -- create_users`) |
| `npm run migrate:rollback` | Roll back the previous migration batch                               |
| `npm start`                | Run the server                                                       |
