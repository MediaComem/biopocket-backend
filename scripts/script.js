/**
 * @module scripts
 */
const config = require('../config');

/**
 * Utility to create reusable command line scripts.
 *
 * Extend this class to create a Node.js script using the BioPocket database
 * that can be run either standalone or as part of another script.
 *
 * When running such a script from the command line, you basically want to go
 * through these steps:
 *
 * * Open a connection to the database
 * * Do the magic
 * * Log success or failure
 * * Close the connection to the database
 * * Exit the process with an appropriate exit code
 *
 * But if you want to reuse that script in another "parent" script, you only
 * want to run the "Do the magic" step, as the parent script will take care of
 * the other steps.
 *
 * This is what this class allows with its `autoRun` function.
 *
 * @class
 */
class Script {

  /**
   * Constructs a new script.
   */
  constructor() {
    this.logger = config.logger('script');
  }

  /**
   * Runs this script, performing the following actions:
   *
   * * Open a connection to the database.
   * * Execute the `run` method.
   * * Execute the `onSuccess` or `onFailure` callback depending on whether the
   *   `run` method was successful (throwing an error or returning a rejected
   *   promise will be considered a failure).
   * * Close the connection to the database.
   * * Exit the process with code 0 if the script was successful or 1 otherwise.
   *
   * If the `$NO_SCRIPT` environment variable is set, do not do anything. This
   * allows this script to be reused by importing it and calling its `run`
   * method manually, with the setup/teardown steps being handled by the parent
   * script.
   */
  autoRun() {
    if (!process.env.NO_SCRIPT) {
      Promise
        .resolve()
        .then(() => this.setUp())
        .then(() => this.run())
        .then(() => this.onSuccess())
        .catch(err => this.onFailure(err))
        .then(() => this.tearDown(), () => this.tearDown())
        .then(() => this.exit());
    }
  }

  /**
   * Runs the script.
   *
   * This method should be overriden by subclasses to do the actual work.
   */
  run() {
    // Do nothing by default.
  }

  /**
   * Called if the script succeeds.
   *
   * It logs an INFO message to the console by default.
   */
  onSuccess() {
    this.logger.info(`${this.constructor.name} successful`);
  }

  /**
   * Called if the script fails.
   *
   * It logs a FATAL message to the console by default and sets the exit code of
   * the script to 1 for when the `exit` method is called.
   *
   * @param {Error} err - The error that caused the script to fail.
   */
  onFailure(err) {
    this.logger.fatal(err);
    this.exitCode = 1;
  }

  /**
   * Called when the script is done executing (successfully or not) and after
   * closing the connection to the database.
   *
   * It exits the process with code 0, or with the value of the `exitCode`
   * property (which is set to 1 by `onFailure`).
   */
  exit() {
    process.exit(this.exitCode || 0);
  }

  /**
   * Called before the script starts running to do any preliminary work,
   * e.g. connect to the database.
   */
  async setUp() {
    await this.db.open();
  }

  /**
   * Called after the script has run (successfully or not) to release resources,
   * e.g. disconnect from the database.
   */
  async tearDown() {
    await this.db.close();
  }

  /**
   * The application's database.
   */
  get db() {
    return require('../server/db');
  }
}

module.exports = Script;
