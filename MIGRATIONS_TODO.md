# BioPocket Migrations Todo

This file liste all the migrations that needs to be done on the database's tables.

## `themes`

* The `original_id` is currently nullable but ought to be mandatory when we start working on the synchronization process.

## `actions`

* Many columns need to be added to the table (compare the database diagram and the excel model)
